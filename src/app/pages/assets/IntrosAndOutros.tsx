import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Copy, Trash2, MoreHorizontal,
  Eye, Star, Pencil, X, Play, Clapperboard, Music, MonitorPlay,
  Image as ImageIcon, BookmarkPlus, ArrowUpDown, MousePointerClick, ChevronDown,
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

// ── Unified Item Type ──────────────────────────────────────────────────────
type SegmentType = "intro" | "outro";

interface UnifiedItem {
  id: number;
  segmentType: SegmentType;
  name: string;
  title: string;       // headline for intros, outroTitle for outros
  image: string;       // backgroundImage for intros, attachedImage for outros
  gradient: string;
  duration: string;
  isTemplate: boolean;
  updated: string;
  used: number;
  starred: boolean;
  // Intro-specific
  musicTrack?: string;
  themeLabel?: string;
  themeColor?: string;
  // Outro-specific
  ctaEnabled?: boolean;
  ctaLabel?: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const ALL_ITEMS: UnifiedItem[] = [
  // Intros
  { id: 101, segmentType: "intro", name: "Welcome — Logo Reveal",       title: "Welcome to Hartwell",    image: "https://images.unsplash.com/photo-1607369542452-78f59815692d?w=400", gradient: "from-[#7c45b0] to-[#7c45b0]", duration: "0:08", isTemplate: true,  updated: "Feb 22, 2026", used: 34, starred: true,  musicTrack: "Upbeat Piano",    themeLabel: "Logo",       themeColor: "#7c45b0" },
  { id: 102, segmentType: "intro", name: "Annual Fund — Full Frame",    title: "Your Impact Matters",    image: "https://images.unsplash.com/photo-1591218214141-45545921d2d9?w=400", gradient: "from-[#1B3461] to-[#2a5298]", duration: "0:06", isTemplate: false, updated: "Feb 20, 2026", used: 18, starred: true,  musicTrack: "Warm Strings",    themeLabel: "Full Frame", themeColor: "#1B3461" },
  { id: 103, segmentType: "intro", name: "Scholarship — Tryptic",       title: "Scholarship Impact",     image: "https://images.unsplash.com/photo-1763890965405-a376a73dc8ed?w=400", gradient: "from-[#0e7490] to-[#22d3ee]", duration: "0:07", isTemplate: false, updated: "Feb 18, 2026", used: 12, starred: false, musicTrack: "Gentle Acoustic", themeLabel: "Tryptic",    themeColor: "#0e7490" },
  { id: 104, segmentType: "intro", name: "Spring Appeal — Light Leak",  title: "Spring at Hartwell",     image: "https://images.unsplash.com/photo-1607369542452-78f59815692d?w=400", gradient: "from-[#C8962A] to-[#f5c842]", duration: "0:06", isTemplate: true,  updated: "Feb 14, 2026", used: 22, starred: false, musicTrack: "Ambient Swell",   themeLabel: "Light Leak", themeColor: "#C8962A" },
  { id: 105, segmentType: "intro", name: "Clean Minimal — Board",       title: "Board of Trustees",      image: "",                                                                   gradient: "from-[#374151] to-[#6b7280]", duration: "0:05", isTemplate: true,  updated: "Jan 28, 2026", used: 9,  starred: false, musicTrack: "None",            themeLabel: "Clean",      themeColor: "#374151" },
  { id: 106, segmentType: "intro", name: "Holiday — Light Leak",        title: "Happy Holidays",         image: "https://images.unsplash.com/photo-1766820875917-3a8a9d6a5905?w=400", gradient: "from-[#C8962A] to-[#f5c842]", duration: "0:08", isTemplate: false, updated: "Dec 10, 2025", used: 28, starred: true,  musicTrack: "Holiday Bells",   themeLabel: "Light Leak", themeColor: "#C8962A" },
  { id: 107, segmentType: "intro", name: "Celebration — Balloons",      title: "Congratulations!",       image: "https://images.unsplash.com/photo-1759054788471-dc7815144604?w=400", gradient: "from-[#dc2626] to-[#f87171]", duration: "0:06", isTemplate: true,  updated: "Jan 5, 2026",  used: 11, starred: false, musicTrack: "Upbeat Pop",      themeLabel: "Balloons",   themeColor: "#dc2626" },
  // Outros
  { id: 201, segmentType: "outro", name: "Thank You — Purple CTA",      title: "Thank You for Watching", image: "https://images.unsplash.com/photo-1553397279-5b10b6c39f1c?w=400", gradient: "from-[#7c45b0] to-[#7c45b0]", duration: "0:12", isTemplate: false, updated: "Feb 22, 2026", used: 42, starred: true,  ctaEnabled: true,  ctaLabel: "Give Now" },
  { id: 202, segmentType: "outro", name: "Hartwell Shield — Branded",   title: "Hartwell University",    image: "https://images.unsplash.com/photo-1607369542452-78f59815692d?w=400", gradient: "from-[#1B3461] to-[#2a5298]", duration: "0:10", isTemplate: false, updated: "Feb 18, 2026", used: 28, starred: true,  ctaEnabled: true,  ctaLabel: "Visit Our Website" },
  { id: 203, segmentType: "outro", name: "Scholarship Impact End",      title: "Your Gift Changes Lives", image: "https://images.unsplash.com/photo-1655720359248-eeace8c709c5?w=400", gradient: "from-[#007c9e] to-[#00C0F5]", duration: "0:15", isTemplate: false, updated: "Feb 14, 2026", used: 9,  starred: false, ctaEnabled: true,  ctaLabel: "Support Scholarships" },
  { id: 204, segmentType: "outro", name: "General Thank You — Minimal", title: "Thank You",              image: "",                                                                   gradient: "from-[#374151] to-[#6b7280]", duration: "0:08", isTemplate: false, updated: "Jan 28, 2026", used: 35, starred: true,  ctaEnabled: false, ctaLabel: "" },
  { id: 205, segmentType: "outro", name: "Holiday Outro — Festive",     title: "Happy Holidays",         image: "https://images.unsplash.com/photo-1766820875917-3a8a9d6a5905?w=400", gradient: "from-[#c41e3a] to-[#e84c5d]", duration: "0:08", isTemplate: false, updated: "Dec 10, 2025", used: 22, starred: false, ctaEnabled: false, ctaLabel: "" },
  { id: 206, segmentType: "outro", name: "Blank Outro Template",        title: "[Your Title]",           image: "",                                                                   gradient: "from-[#7c45b0] to-[#a78bfa]", duration: "0:10", isTemplate: true,  updated: "Jan 1, 2026",  used: 0,  starred: false, ctaEnabled: true,  ctaLabel: "[CTA Label]" },
  { id: 207, segmentType: "outro", name: "CTA-Free Template",           title: "[Your Title]",           image: "",                                                                   gradient: "from-[#374151] to-[#9ca3af]", duration: "0:08", isTemplate: true,  updated: "Jan 1, 2026",  used: 0,  starred: false, ctaEnabled: false, ctaLabel: "" },
];

// ── Filters ──────────────────────────────────────────────────────────────
const COMBINED_FILTERS: FilterDef[] = [
  {
    key: "type", label: "Type", icon: Clapperboard, group: "Type",
    type: "select", essential: true,
    options: [
      { value: "intro", label: "Intros" },
      { value: "outro", label: "Outros" },
    ],
  },
  {
    key: "status", label: "Status", icon: BookmarkPlus, group: "Status",
    type: "select", essential: true,
    options: [
      { value: "template", label: "Templates" },
      { value: "custom", label: "Custom" },
    ],
  },
  DATE_CREATED_FILTER,
  CREATED_BY_FILTER,
];

// ═════════════════════════════════════════════════════════════════════════
export function IntrosAndOutros() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    COMBINED_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [items, setItems] = useState(ALL_ITEMS);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const filtered = items.filter(item => {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    const typeVals = filterValues.type ?? [];
    if (typeVals.length > 0 && !typeVals.includes(item.segmentType)) return false;
    const statusVals = filterValues.status ?? [];
    if (statusVals.length > 0) {
      if (statusVals.includes("template") && !item.isTemplate) return false;
      if (statusVals.includes("custom") && item.isTemplate) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "used") return b.used - a.used;
    return 0;
  });

  const handleDuplicate = (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const copy = { ...item, id: Date.now(), name: `${item.name} (Duplicate)`, used: 0, starred: false, isTemplate: false };
    setItems(prev => [copy, ...prev]);
    show(`"${item.name}" duplicated`, "success");
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.filter(i => i.id !== id));
    show(`"${item?.name}" deleted`, "success");
    setDeleteConfirm(null);
  };

  const toggleStar = (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i));
  };

  const introCount = filtered.filter(i => i.segmentType === "intro").length;
  const outroCount = filtered.filter(i => i.segmentType === "outro").length;

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "Intros & Outros" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Intros & Outros</h1>
          <p className="text-[13px] text-tv-text-secondary mt-1">Manage intro slideshows and outro screens for your campaign videos.</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors shrink-0"
          >
            <Plus size={15} />Create New <ChevronDown size={12} />
          </button>
          {createMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setCreateMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-tv-border-light shadow-lg z-40 overflow-hidden">
                <button onClick={() => { navigate("/intro/create"); setCreateMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-tv-text-primary hover:bg-tv-surface transition-colors text-left">
                  <Clapperboard size={14} className="text-tv-brand" />New Intro
                </button>
                <button onClick={() => { navigate("/outro/create"); setCreateMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-tv-text-primary hover:bg-tv-surface transition-colors text-left border-t border-tv-border-divider">
                  <MonitorPlay size={14} className="text-tv-brand" />New Outro
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={COMBINED_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort items" style={{ color: TV.brand }}>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search intros & outros..." aria-label="Search" className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-decorative focus-visible:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">
        {filtered.length} item{filtered.length !== 1 ? "s" : ""} · {introCount} intro{introCount !== 1 ? "s" : ""}, {outroCount} outro{outroCount !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
            <Clapperboard size={22} className="text-tv-text-decorative" />
          </div>
          <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No items found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div role="button" tabIndex={0} key={item.id}
              onClick={() => navigate(item.segmentType === "intro" ? `/intro/create?edit=${item.id}` : `/outro/create?edit=${item.id}`)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(item.segmentType === "intro" ? `/intro/create?edit=${item.id}` : `/outro/create?edit=${item.id}`); }}}
              aria-label={`${item.segmentType === "intro" ? "Intro" : "Outro"}: ${item.name}`}
              className="bg-white rounded-lg border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer text-left">
              {/* Thumbnail */}
              <div className={`h-32 bg-gradient-to-br ${item.gradient} relative overflow-hidden`}>
                {item.image ? (
                  <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover opacity-50" />
                ) : null}
                {/* Title overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                  <p className="text-[14px] font-black text-white drop-shadow-lg leading-tight">{item.title}</p>
                </div>
                {/* Play hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                    <Play size={14} className="text-white ml-0.5" fill="white" />
                  </div>
                </div>
                {/* Duration */}
                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{item.duration}</span>
                {/* Type badge */}
                <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  item.segmentType === "intro"
                    ? "bg-tv-brand-tint text-tv-brand"
                    : "bg-tv-info-bg text-tv-info"
                }`}>
                  {item.segmentType === "intro" ? "Intro" : "Outro"}
                </span>
                {/* Theme badge for intros */}
                {item.themeLabel && (
                  <span className="absolute top-8 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/90" style={{ color: item.themeColor }}>
                    {item.themeLabel}
                  </span>
                )}
                {/* Template badge */}
                {item.isTemplate && (
                  <span className={`absolute ${item.themeLabel ? "top-[52px]" : "top-8"} left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-tv-warning-bg text-tv-warning`}>
                    Template
                  </span>
                )}
                {/* Star */}
                <button onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }} aria-label={item.starred ? "Unstar" : "Star"} className="absolute top-2 right-2 z-10 p-1 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
                  <Star size={13} className={item.starred ? "text-tv-star fill-tv-star" : "text-white/70"} />
                </button>
              </div>

              <div className="p-3.5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-tv-text-primary truncate">{item.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {item.segmentType === "intro" && item.musicTrack && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary">
                          <Music size={9} />{item.musicTrack}
                        </span>
                      )}
                      {item.segmentType === "outro" && item.ctaEnabled != null && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary">
                          <MousePointerClick size={9} />{item.ctaEnabled ? item.ctaLabel : "No CTA"}
                        </span>
                      )}
                      {item.image ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary">
                          <ImageIcon size={9} />Image
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)} aria-label="More actions" className="p-1 rounded hover:bg-tv-surface transition-colors">
                      <MoreHorizontal size={13} className="text-tv-text-secondary" />
                    </button>
                    {menuOpen === item.id && (
                      <AssetActionMenu
                        onClose={() => setMenuOpen(null)}
                        actions={[
                          { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(item.segmentType === "intro" ? `/intro/create?edit=${item.id}` : `/outro/create?edit=${item.id}`); setMenuOpen(null); } },
                          { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(item.id) },
                          { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(item.id); setMenuOpen(null); }, danger: true },
                        ]}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-tv-text-secondary">
                  <span>{item.updated}</span>
                  <span>Used {item.used}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <DeleteModal
          title="Delete item"
          message={`Are you sure you want to delete "${items.find(i => i.id === deleteConfirm)?.name}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
