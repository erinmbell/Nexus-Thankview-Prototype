import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search, Play, Copy, Trash2, MoreHorizontal,
  Eye, Star, X, Send, Clapperboard, MonitorPlay, Music,
  Image as ImageIcon, Type, Palette, Link2, Clock, BookmarkPlus, Pencil,
  ArrowUpDown,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { AssetActionMenu } from "../../components/ui/AssetActionMenu";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FilterBar } from "../../components/FilterBar";
import type { FilterDef, FilterValues } from "../../components/FilterBar";
import { DATE_CREATED_FILTER, CREATED_BY_FILTER } from "../../components/filterDefs";
import { Menu, ActionIcon, Tooltip, Text, FocusTrap } from "@mantine/core";
import { TV } from "../../theme";

// ── Intro theme reference ───────────────────────────────────────────────────
const INTRO_THEMES: Record<string, { label: string; color: string }> = {
  logo:       { label: "Logo",       color: "#7c45b0" },
  "full-frame": { label: "Full Frame", color: "#1B3461" },
  tryptic:    { label: "Tryptic",    color: "#0e7490" },
  "light-leak": { label: "Light Leak", color: "#C8962A" },
  cubed:      { label: "Cubed",      color: "#8b5cf6" },
  clean:      { label: "Clean",      color: "#374151" },
  linen:      { label: "Linen",      color: "#92400e" },
  emboss:     { label: "Emboss",     color: "#1a1a2e" },
  balloons:   { label: "Balloons",   color: "#dc2626" },
};

// ── Color palette reference ─────────────────────────────────────────────────
const COLOR_PALETTE = [
  { hex: "#7c45b0", label: "Purple" },
  { hex: "#1B3461", label: "Navy" },
  { hex: "#166534", label: "Green" },
  { hex: "#C8962A", label: "Gold" },
  { hex: "#dc2626", label: "Red" },
  { hex: "#0e7490", label: "Teal" },
  { hex: "#374151", label: "Gray" },
  { hex: "#1a1a2e", label: "Dark" },
];

// ── Combined data ───────────────────────────────────────────────────────────
interface IntroOutroItem {
  id: number;
  name: string;
  kind: "intro" | "outro";
  // Intro-specific
  theme?: string;
  headline?: string;
  musicTrack?: string;
  // Outro-specific
  ctaLabel?: string;
  ctaUrl?: string;
  bgColor?: string;
  outroMusic?: string;
  // Shared
  gradient: string;
  backgroundImage: string;
  duration: string;
  isTemplate: boolean;
  updated: string;
  used: number;
  starred: boolean;
}

const ITEMS: IntroOutroItem[] = [
  // ── Intros ──
  { id: 1,  kind: "intro", name: "Welcome — Logo Reveal",     theme: "logo",       headline: "Welcome to Hartwell",  musicTrack: "Upbeat Piano",     gradient: "from-[#7c45b0] to-[#7c45b0]", backgroundImage: "https://images.unsplash.com/photo-1607369542452-78f59815692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwc3ByaW5nfGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:08", isTemplate: true,  updated: "Feb 22, 2026", used: 34, starred: true },
  { id: 2,  kind: "intro", name: "Annual Fund — Full Frame",   theme: "full-frame", headline: "Your Impact Matters",   musicTrack: "Warm Strings",     gradient: "from-[#1B3461] to-[#2a5298]", backgroundImage: "https://images.unsplash.com/photo-1591218214141-45545921d2d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwZ3JhZHVhdGlvbiUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:06", isTemplate: false, updated: "Feb 20, 2026", used: 18, starred: true },
  { id: 3,  kind: "intro", name: "Scholarship — Tryptic",      theme: "tryptic",    headline: "Scholarship Impact",    musicTrack: "Gentle Acoustic",  gradient: "from-[#0e7490] to-[#22d3ee]", backgroundImage: "https://images.unsplash.com/photo-1763890965405-a376a73dc8ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGludGVyaW9yJTIwd2FybXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:07", isTemplate: false, updated: "Feb 18, 2026", used: 12, starred: false },
  { id: 4,  kind: "intro", name: "Spring Appeal — Light Leak",  theme: "light-leak", headline: "Spring at Hartwell",     musicTrack: "Ambient Swell",    gradient: "from-[#C8962A] to-[#f5c842]", backgroundImage: "https://images.unsplash.com/photo-1607369542452-78f59815692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwc3ByaW5nfGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:06", isTemplate: true,  updated: "Feb 14, 2026", used: 22, starred: false },
  { id: 5,  kind: "intro", name: "Gala 2026 — Cubed",          theme: "cubed",      headline: "You're Invited",        musicTrack: "Elegant Waltz",    gradient: "from-[#8b5cf6] to-[#a78bfa]", backgroundImage: "", duration: "0:08", isTemplate: false, updated: "Feb 10, 2026", used: 6, starred: false },
  { id: 6,  kind: "intro", name: "Holiday — Light Leak",       theme: "light-leak", headline: "Happy Holidays",         musicTrack: "Holiday Bells",    gradient: "from-[#C8962A] to-[#f5c842]", backgroundImage: "https://images.unsplash.com/photo-1766820875917-3a8a9d6a5905?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xpZGF5JTIwd2ludGVyJTIwbGlnaHRzJTIwZmVzdGl2ZXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:08", isTemplate: false, updated: "Dec 10, 2025", used: 28, starred: true },
  { id: 7,  kind: "intro", name: "Celebration — Balloons",      theme: "balloons",   headline: "Congratulations!",       musicTrack: "Upbeat Pop",       gradient: "from-[#dc2626] to-[#f87171]", backgroundImage: "", duration: "0:06", isTemplate: true,  updated: "Jan 5, 2026", used: 11, starred: false },
  // ── Outros ──
  { id: 101, kind: "outro", name: "Thank You — Purple CTA",        bgColor: "#7c45b0", ctaLabel: "Give Now",             ctaUrl: "https://hartwell.edu/give",       outroMusic: "Gentle Close",   gradient: "from-[#7c45b0] to-[#7c45b0]", backgroundImage: "https://images.unsplash.com/photo-1553397279-5b10b6c39f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFuayUyMHlvdSUyMGhhbmR3cml0dGVuJTIwbm90ZSUyMGNhcmR8ZW58MXx8fHwxNzcyMDY3NjI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:12", isTemplate: false, updated: "Feb 22, 2026", used: 42, starred: true },
  { id: 102, kind: "outro", name: "Hartwell Shield — Branded",      bgColor: "#1B3461", ctaLabel: "Visit Our Website",    ctaUrl: "https://hartwell.edu",            outroMusic: "Soft Piano",     gradient: "from-[#1B3461] to-[#2a5298]", backgroundImage: "https://images.unsplash.com/photo-1607369542452-78f59815692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwc3ByaW5nfGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:10", isTemplate: false, updated: "Feb 18, 2026", used: 28, starred: true },
  { id: 103, kind: "outro", name: "Scholarship Impact End",         bgColor: "#007c9e", ctaLabel: "Support Scholarships", ctaUrl: "https://hartwell.edu/scholarships", outroMusic: "Upbeat Ending", gradient: "from-[#007c9e] to-[#00C0F5]", backgroundImage: "https://images.unsplash.com/photo-1655720359248-eeace8c709c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb25hdGlvbiUyMGNoYXJpdHklMjBnaXZpbmclMjBoYW5kc3xlbnwxfHx8fDE3NzE5ODM4MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:15", isTemplate: false, updated: "Feb 14, 2026", used: 9, starred: false },
  { id: 104, kind: "outro", name: "Give Now — Green CTA",           bgColor: "#166534", ctaLabel: "Give Now",             ctaUrl: "https://hartwell.edu/give",       outroMusic: "None",           gradient: "from-[#166534] to-[#15803d]", backgroundImage: "", duration: "0:10", isTemplate: false, updated: "Feb 10, 2026", used: 15, starred: false },
  { id: 105, kind: "outro", name: "General Thank You — Minimal",    bgColor: "#374151", ctaLabel: "",                     ctaUrl: "",                                outroMusic: "Soft Piano",     gradient: "from-[#374151] to-[#6b7280]", backgroundImage: "", duration: "0:08", isTemplate: false, updated: "Jan 28, 2026", used: 35, starred: true },
  { id: 106, kind: "outro", name: "Holiday Outro — Festive",        bgColor: "#c41e3a", ctaLabel: "",                     ctaUrl: "",                                outroMusic: "Holiday Bells",  gradient: "from-[#c41e3a] to-[#e84c5d]", backgroundImage: "https://images.unsplash.com/photo-1766820875917-3a8a9d6a5905?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xpZGF5JTIwd2ludGVyJTIwbGlnaHRzJTIwZmVzdGl2ZXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", duration: "0:08", isTemplate: false, updated: "Dec 10, 2025", used: 22, starred: false },
  { id: 107, kind: "outro", name: "Blank Outro Template",           bgColor: "#7c45b0", ctaLabel: "[CTA Label]",          ctaUrl: "",                                outroMusic: "Gentle Close",   gradient: "from-[#7c45b0] to-[#a78bfa]", backgroundImage: "", duration: "0:10", isTemplate: true,  updated: "Jan 1, 2026", used: 0, starred: false },
];

const VIDEO_CLIP_FILTERS: FilterDef[] = [
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

// ═════════════════════════════════════════════════════════════════════════════
export function VideoClips() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    VIDEO_CLIP_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [items, setItems] = useState(ITEMS);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);

  const filtered = items.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    const typeVals = filterValues.type ?? [];
    if (typeVals.length > 0 && !typeVals.includes(c.kind)) return false;
    const statusVals = filterValues.status ?? [];
    if (statusVals.length > 0) {
      if (statusVals.includes("template") && !c.isTemplate) return false;
      if (statusVals.includes("custom") && c.isTemplate) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "used") return b.used - a.used;
    return 0;
  });

  const introCount = items.filter(i => i.kind === "intro").length;
  const outroCount = items.filter(i => i.kind === "outro").length;

  const handleDuplicate = (id: number) => {
    const item = items.find(c => c.id === id);
    if (!item) return;
    const copy = { ...item, id: Date.now(), name: `${item.name} (Duplicate)`, used: 0, starred: false, isTemplate: false };
    setItems(prev => [copy, ...prev]);
    show(`"${item.name}" duplicated`, "success");
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const item = items.find(c => c.id === id);
    setItems(prev => prev.filter(c => c.id !== id));
    show(`"${item?.name}" deleted`, "success");
    setDeleteConfirm(null);
  };

  const toggleStar = (id: number) => {
    setItems(prev => prev.map(c => c.id === id ? { ...c, starred: !c.starred } : c));
  };

  const toggleTemplate = (id: number) => {
    const item = items.find(c => c.id === id);
    if (!item) return;
    setItems(prev => prev.map(c => c.id === id ? { ...c, isTemplate: !c.isTemplate } : c));
    show(item.isTemplate ? `"${item.name}" removed from templates` : `"${item.name}" promoted to template`, "success");
    setMenuOpen(null);
  };

  const preview = previewId ? items.find(c => c.id === previewId) : null;

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
          <p className="text-[13px] text-tv-text-secondary mt-1">
            Build themed intro slideshows and static outro screens to bookend your campaign videos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/outro/create")}
            className="flex items-center gap-2 border border-tv-border-light text-tv-text-primary px-4 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#f0f9ff] hover:border-[#7dd3fc] transition-colors"
          >
            <MonitorPlay size={14} className="text-[#0369a1]" />New Outro
          </button>
          <button
            onClick={() => navigate("/intro/create")}
            className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors"
          >
            <Clapperboard size={14} />New Intro
          </button>
        </div>
      </div>

      {/* Quick stats */}


      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={VIDEO_CLIP_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort clips" style={{ color: TV.brand }}>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search intros & outros…" aria-label="Search intros and outros" className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-decorative focus-visible:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>

      {/* Cards */}
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
          {filtered.map(item => {
            const themeInfo = item.kind === "intro" && item.theme ? INTRO_THEMES[item.theme] : null;
            const bgColorInfo = item.kind === "outro" && item.bgColor ? COLOR_PALETTE.find(c => c.hex === item.bgColor) : null;

            return (
              <div role="button" tabIndex={0} key={item.id} onClick={() => setPreviewId(item.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(item.id); }}} aria-label={`Preview: ${item.name}`} className="bg-white rounded-xl border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer text-left">
                {/* Thumbnail */}
                <div className={`h-32 bg-gradient-to-br ${item.gradient} relative overflow-hidden`}>
                  {item.backgroundImage ? (
                    <img src={item.backgroundImage} alt={item.name} className="w-full h-full object-cover opacity-40" />
                  ) : null}
                  {/* Content overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                    {item.kind === "intro" && item.headline && (
                      <p className="text-[14px] font-black text-white drop-shadow-lg leading-tight">{item.headline}</p>
                    )}
                    {item.kind === "outro" && (
                      <>
                        <p className="text-[13px] font-bold text-white drop-shadow-lg mb-2">{item.name.split(" — ")[0]}</p>
                        {item.ctaLabel && item.ctaLabel !== "[CTA Label]" && (
                          <span className="inline-block bg-white/90 text-[10px] font-bold px-3 py-1 rounded-full text-tv-text-primary">
                            {item.ctaLabel}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {/* Play hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                      <Play size={14} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* Duration */}
                  <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{item.duration}</span>
                  {/* Kind badge */}
                  <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${item.kind === "intro" ? "bg-tv-brand-tint text-tv-text-brand" : "bg-[#f0f9ff] text-[#0369a1]"}`}>
                    {item.kind === "intro" ? "Intro" : "Outro"}
                    {themeInfo && ` · ${themeInfo.label}`}
                  </span>
                  {/* Template badge */}
                  {item.isTemplate && (
                    <span className="absolute top-8 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-tv-brand-tint text-tv-text-brand">
                      Template
                    </span>
                  )}
                  {/* Star */}
                  <button onClick={(e) => { e.stopPropagation(); toggleStar(item.id); }} aria-label={item.starred ? "Unstar" : "Star"} className="absolute top-2 right-2 z-10 p-1 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
                    <Star size={13} className={item.starred ? "text-[#EAB308] fill-[#EAB308]" : "text-white/70"} />
                  </button>
                </div>

                <div className="p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-tv-text-primary truncate">{item.name}</p>
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        {item.kind === "intro" && (
                          <>
                            {item.musicTrack && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-tv-text-secondary">
                                <Music size={9} />{item.musicTrack}
                              </span>
                            )}
                            {themeInfo && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-tv-text-secondary">
                                <Palette size={9} />{themeInfo.label}
                              </span>
                            )}
                          </>
                        )}
                        {item.kind === "outro" && (
                          <>
                            {item.ctaLabel && item.ctaLabel !== "[CTA Label]" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-tv-text-brand">
                                <Link2 size={9} />{item.ctaLabel}
                              </span>
                            )}
                            {bgColorInfo && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-tv-text-secondary">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: bgColorInfo.hex }} />
                                {bgColorInfo.label}
                              </span>
                            )}
                            {item.outroMusic && item.outroMusic !== "None" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-tv-text-secondary">
                                <Music size={9} />{item.outroMusic}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)} aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen === item.id} className="p-1 rounded hover:bg-tv-surface transition-colors">
                        <MoreHorizontal size={13} className="text-tv-text-secondary" />
                      </button>
                      {menuOpen === item.id && (
                        <AssetActionMenu
                          onClose={() => setMenuOpen(null)}
                          actions={[
                            { icon: <Eye size={12} />, label: "Preview", onClick: () => { setPreviewId(item.id); setMenuOpen(null); } },
                            { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(item.kind === "intro" ? "/intro/create" : "/outro/create"); setMenuOpen(null); } },
                            { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(item.id) },
                            { icon: <BookmarkPlus size={12} />, label: item.isTemplate ? "Remove Template Status" : "Promote to Template", onClick: () => toggleTemplate(item.id) },
                            { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(item.id); setMenuOpen(null); }, danger: true },
                          ]}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-tv-text-secondary">
                    <span>{item.updated}</span>
                    <span>Used {item.used}×</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {preview && (() => {
        const themeInfo = preview.kind === "intro" && preview.theme ? INTRO_THEMES[preview.theme] : null;
        return (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setPreviewId(null)} />
            <div className="fixed inset-0 flex items-center justify-center z-[61] pointer-events-none p-4" role="dialog" aria-modal="true" aria-label={`Preview: ${preview.name}`} onKeyDown={(e) => { if (e.key === "Escape") setPreviewId(null); }}>
              <FocusTrap active>
              <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider">
                  <div>
                    <p className="text-[14px] font-semibold text-tv-text-primary">{preview.name}</p>
                    <p className="text-[11px] text-tv-text-secondary">
                      {preview.kind === "intro" ? "Intro" : "Outro"} · {preview.duration}
                      {themeInfo && ` · ${themeInfo.label} theme`}
                    </p>
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
                          width={200}
                          zIndex={70}
                          onClose={() => setModalMenuOpen(false)}
                          actions={[
                            { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(preview.kind === "intro" ? "/intro/create" : "/outro/create"); setModalMenuOpen(false); } },
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
                {/* Visual preview */}
                <div className={`aspect-video bg-gradient-to-br ${preview.gradient} relative overflow-hidden`}>
                  {preview.backgroundImage ? (
                    <img src={preview.backgroundImage} alt={preview.name} className="w-full h-full object-cover opacity-40" />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    {preview.kind === "intro" && preview.headline && (
                      <p className="text-[22px] font-black text-white drop-shadow-lg mb-3">{preview.headline}</p>
                    )}
                    {preview.kind === "outro" && (
                      <>
                        <p className="text-[20px] font-black text-white drop-shadow-lg mb-3">{preview.name.split(" — ")[0]}</p>
                        {preview.ctaLabel && preview.ctaLabel !== "[CTA Label]" && (
                          <span className="inline-block bg-white/90 text-[12px] font-bold px-5 py-2 rounded-full text-tv-text-primary shadow-md">
                            {preview.ctaLabel}
                          </span>
                        )}
                      </>
                    )}
                    <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors mt-4">
                      <Play size={24} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded font-mono">{preview.duration}</span>
                  <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${preview.kind === "intro" ? "bg-tv-brand-tint text-tv-text-brand" : "bg-[#f0f9ff] text-[#0369a1]"}`}>
                    {preview.kind === "intro" ? "Intro" : "Outro"}
                    {themeInfo && ` · ${themeInfo.label}`}
                  </span>
                </div>
                {/* Details */}
                <div className="px-5 py-4 space-y-2 border-b border-tv-border-divider">
                  {preview.kind === "intro" && (
                    <>
                      {preview.headline && (
                        <div className="flex items-center gap-4 text-[12px]">
                          <span className="flex items-center gap-1.5 text-tv-text-secondary"><Type size={11} />Intro Text:</span>
                          <span className="font-medium text-tv-text-primary">{preview.headline}</span>
                        </div>
                      )}
                      {themeInfo && (
                        <div className="flex items-center gap-4 text-[12px]">
                          <span className="flex items-center gap-1.5 text-tv-text-secondary"><Palette size={11} />Theme:</span>
                          <span className="font-medium text-tv-text-primary" style={{ color: themeInfo.color }}>{themeInfo.label}</span>
                        </div>
                      )}
                      {preview.musicTrack && (
                        <div className="flex items-center gap-4 text-[12px]">
                          <span className="flex items-center gap-1.5 text-tv-text-secondary"><Music size={11} />Music:</span>
                          <span className="font-medium text-tv-text-primary">{preview.musicTrack}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[12px]">
                        <span className="flex items-center gap-1.5 text-tv-text-secondary"><ImageIcon size={11} />Photo:</span>
                        <span className="font-medium text-tv-text-primary">{preview.backgroundImage ? "Custom image" : "None"}</span>
                      </div>
                    </>
                  )}
                  {preview.kind === "outro" && (
                    <>
                      {preview.bgColor && (
                        <div className="flex items-center gap-4 text-[12px]">
                          <span className="flex items-center gap-1.5 text-tv-text-secondary"><Palette size={11} />Background:</span>
                          <span className="flex items-center gap-2 font-medium text-tv-text-primary">
                            <span className="w-3 h-3 rounded-full border border-tv-border-light" style={{ backgroundColor: preview.bgColor }} />
                            {COLOR_PALETTE.find(c => c.hex === preview.bgColor)?.label || preview.bgColor}
                          </span>
                        </div>
                      )}
                      {preview.ctaLabel && preview.ctaLabel !== "[CTA Label]" && (
                        <>
                          <div className="flex items-center gap-4 text-[12px]">
                            <span className="flex items-center gap-1.5 text-tv-text-secondary"><Type size={11} />Button Text:</span>
                            <span className="font-medium text-tv-text-primary">{preview.ctaLabel}</span>
                          </div>
                          {preview.ctaUrl && (
                            <div className="flex items-center gap-4 text-[12px]">
                              <span className="flex items-center gap-1.5 text-tv-text-secondary"><Link2 size={11} />CTA Link:</span>
                              <span className="font-medium text-tv-text-brand truncate max-w-[250px]">{preview.ctaUrl}</span>
                            </div>
                          )}
                        </>
                      )}
                      {preview.outroMusic && (
                        <div className="flex items-center gap-4 text-[12px]">
                          <span className="flex items-center gap-1.5 text-tv-text-secondary"><Music size={11} />Music:</span>
                          <span className="font-medium text-tv-text-primary">{preview.outroMusic}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="flex items-center gap-1.5 text-tv-text-secondary"><Clock size={11} />Duration:</span>
                    <span className="font-medium text-tv-text-primary">{preview.duration}</span>
                  </div>
                  {preview.isTemplate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-tv-brand-tint text-tv-text-brand">Template</span>
                  )}
                </div>
                <div className="px-5 py-4">
                  <button onClick={() => { setPreviewId(null); navigate("/campaigns/create"); }} className="w-full py-2.5 bg-tv-brand-bg text-white rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors flex items-center justify-center gap-2"><Send size={12} />Use in Campaign</button>
                </div>
              </div>
              </FocusTrap>
            </div>
          </>
        );
      })()}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <DeleteModal
          title="Delete this item?"
          description="This action cannot be undone. Campaigns already using this intro or outro will not be affected."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}