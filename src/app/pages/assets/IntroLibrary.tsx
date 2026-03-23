import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Copy, Trash2, MoreHorizontal,
  Eye, Star, Send, Pencil, X, Play, Clapperboard, Music,
  Image as ImageIcon, Type, Clock, BookmarkPlus, ArrowUpDown,
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

// ── Theme definitions (the 9 ThankView carried-over themes) ────────────────
const INTRO_THEMES = [
  { key: "logo",       label: "Logo",       color: "#7c45b0", description: "Centered logo with animated reveal",           category: "image" as const, fields: ["Background color (black/white)", "Music", "1 image"] },
  { key: "full-frame", label: "Full Frame",  color: "#1B3461", description: "Full-bleed background image with text overlay", category: "image" as const, fields: ["Music", "1 image"] },
  { key: "tryptic",    label: "Tryptic",     color: "#0e7490", description: "Three-panel image montage",                    category: "image" as const, fields: ["Background color (black/white)", "Music", "3 images"] },
  { key: "light-leak", label: "Light Leak",  color: "#C8962A", description: "Warm light leak overlay on background",        category: "image" as const, fields: ["Music", "1 image", "Font", "2 lines of text"] },
  { key: "cubed",      label: "Cubed",       color: "#8b5cf6", description: "3D cube transition with images",               category: "image" as const, fields: ["Music", "8 images", "Font", "3 lines of text"] },
  { key: "clean",      label: "Clean",       color: "#374151", description: "Minimal white background with logo",           category: "message" as const, fields: ["Music", "Font", "1 line of text", "Font & background color"] },
  { key: "linen",      label: "Linen",       color: "#92400e", description: "Textured linen background with text",          category: "message" as const, fields: ["Music", "Font", "1 line of text", "1 image"] },
  { key: "emboss",     label: "Emboss",      color: "#1a1a2e", description: "Embossed text effect on dark background",      category: "message" as const, fields: ["Music", "Font", "1 line of text", "Text color (black/gold)"] },
  { key: "balloons",   label: "Balloons",    color: "#dc2626", description: "Celebratory balloon animation",                category: "message" as const, fields: ["Music", "Font", "2 lines of text", "3 color styles"] },
] as const;

type ThemeKey = typeof INTRO_THEMES[number]["key"];

interface Intro {
  id: number;
  name: string;
  theme: ThemeKey;
  headline: string;
  backgroundImage: string;
  gradient: string;
  musicTrack: string;
  duration: string;
  isTemplate: boolean;
  updated: string;
  used: number;
  starred: boolean;
}

const INTROS: Intro[] = [
  { id: 1,  name: "Welcome — Logo Reveal",       theme: "logo",       headline: "Welcome to Hartwell",           backgroundImage: "https://images.unsplash.com/photo-1607369542452-78f59815692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwc3ByaW5nfGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",           gradient: "from-[#7c45b0] to-[#7c45b0]",   musicTrack: "Upbeat Piano",   duration: "0:08", isTemplate: true,  updated: "Feb 22, 2026", used: 34, starred: true },
  { id: 2,  name: "Annual Fund — Full Frame",     theme: "full-frame", headline: "Your Impact Matters",            backgroundImage: "https://images.unsplash.com/photo-1591218214141-45545921d2d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwZ3JhZHVhdGlvbiUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",       gradient: "from-[#1B3461] to-[#2a5298]",   musicTrack: "Warm Strings",   duration: "0:06", isTemplate: false, updated: "Feb 20, 2026", used: 18, starred: true },
  { id: 3,  name: "Scholarship — Tryptic",        theme: "tryptic",    headline: "Scholarship Impact",             backgroundImage: "https://images.unsplash.com/photo-1763890965405-a376a73dc8ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGludGVyaW9yJTIwd2FybXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",    gradient: "from-[#0e7490] to-[#22d3ee]",   musicTrack: "Gentle Acoustic", duration: "0:07", isTemplate: false, updated: "Feb 18, 2026", used: 12, starred: false },
  { id: 4,  name: "Spring Appeal — Light Leak",    theme: "light-leak", headline: "Spring at Hartwell",              backgroundImage: "https://images.unsplash.com/photo-1607369542452-78f59815692d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwc3ByaW5nfGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",           gradient: "from-[#C8962A] to-[#f5c842]",   musicTrack: "Ambient Swell",  duration: "0:06", isTemplate: true,  updated: "Feb 14, 2026", used: 22, starred: false },
  { id: 5,  name: "Gala 2026 — Cubed",            theme: "cubed",      headline: "You're Invited",                  backgroundImage: "https://images.unsplash.com/photo-1591218214141-45545921d2d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwZ3JhZHVhdGlvbiUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc3MjA2NzYyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",       gradient: "from-[#8b5cf6] to-[#a78bfa]",   musicTrack: "Elegant Waltz",  duration: "0:08", isTemplate: false, updated: "Feb 10, 2026", used: 6,  starred: false },
  { id: 6,  name: "Clean Minimal — Board",        theme: "clean",      headline: "Board of Trustees",               backgroundImage: "",                                                                                                                                                                                                                                                                                             gradient: "from-[#374151] to-[#6b7280]",   musicTrack: "None",           duration: "0:05", isTemplate: true,  updated: "Jan 28, 2026", used: 9,  starred: false },
  { id: 7,  name: "Linen Texture — Alumni",       theme: "linen",      headline: "Dear Alumni",                     backgroundImage: "https://images.unsplash.com/photo-1763890965405-a376a73dc8ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGlicmFyeSUyMGludGVyaW9yJTIwd2FybXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",    gradient: "from-[#92400e] to-[#d97706]",   musicTrack: "Soft Piano",     duration: "0:07", isTemplate: false, updated: "Jan 20, 2026", used: 15, starred: true },
  { id: 8,  name: "Embossed Dark — Endowment",    theme: "emboss",     headline: "Endowment Report",                backgroundImage: "",                                                                                                                                                                                                                                                                                             gradient: "from-[#1a1a2e] to-[#374151]",   musicTrack: "Deep Strings",   duration: "0:06", isTemplate: false, updated: "Jan 15, 2026", used: 4,  starred: false },
  { id: 9,  name: "Holiday — Light Leak",         theme: "light-leak", headline: "Happy Holidays",                  backgroundImage: "https://images.unsplash.com/photo-1766820875917-3a8a9d6a5905?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xpZGF5JTIwd2ludGVyJTIwbGlnaHRzJTIwZmVzdGl2ZXxlbnwxfHx8fDE3NzIwNjc2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", gradient: "from-[#C8962A] to-[#f5c842]",   musicTrack: "Holiday Bells",  duration: "0:08", isTemplate: false, updated: "Dec 10, 2025", used: 28, starred: true },
  { id: 10, name: "Celebration — Balloons",        theme: "balloons",   headline: "Congratulations!",                backgroundImage: "https://images.unsplash.com/photo-1759054788471-dc7815144604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWxsb29ucyUyMGNlbGVicmF0aW9uJTIwY29sb3JmdWx8ZW58MXx8fHwxNzcyMDY3NjIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",   gradient: "from-[#dc2626] to-[#f87171]",   musicTrack: "Upbeat Pop",     duration: "0:06", isTemplate: true,  updated: "Jan 5, 2026",  used: 11, starred: false },
  { id: 11, name: "Donor Welcome — Logo",          theme: "logo",       headline: "Thank You for Giving",            backgroundImage: "https://images.unsplash.com/photo-1655720359248-eeace8c709c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb25hdGlvbiUyMGNoYXJpdHklMjBnaXZpbmclMjBoYW5kc3xlbnwxfHx8fDE3NzE5ODM4MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", gradient: "from-[#7c45b0] to-[#7c45b0]",   musicTrack: "Warm Strings",   duration: "0:07", isTemplate: false, updated: "Feb 24, 2026", used: 8,  starred: false },
  { id: 12, name: "Full Frame Template — Purple",  theme: "full-frame", headline: "[Your Headline]",                  backgroundImage: "",                                                                                                                                                                                                                                                                                             gradient: "from-[#1B3461] to-[#2a5298]",   musicTrack: "None",           duration: "0:06", isTemplate: true,  updated: "Jan 1, 2026",  used: 0,  starred: false },
  { id: 13, name: "Tryptic Template — Default",    theme: "tryptic",    headline: "[Your Headline]",                  backgroundImage: "",                                                                                                                                                                                                                                                                                             gradient: "from-[#0e7490] to-[#22d3ee]",   musicTrack: "None",           duration: "0:07", isTemplate: true,  updated: "Jan 1, 2026",  used: 0,  starred: false },
  { id: 14, name: "Cubed Template — Default",      theme: "cubed",      headline: "[Your Headline]",                  backgroundImage: "",                                                                                                                                                                                                                                                                                             gradient: "from-[#8b5cf6] to-[#a78bfa]",   musicTrack: "None",           duration: "0:08", isTemplate: true,  updated: "Jan 1, 2026",  used: 0,  starred: false },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function themeInfo(key: ThemeKey) {
  return INTRO_THEMES.find(t => t.key === key)!;
}

const INTRO_FILTERS: FilterDef[] = [
  {
    key: "theme", label: "Theme", icon: Clapperboard, group: "Theme",
    type: "multi-select", essential: true,
    options: INTRO_THEMES.map(t => ({ value: t.key, label: t.label })),
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
export function IntroLibrary() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    INTRO_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [intros, setIntros] = useState(INTROS);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);

  const filtered = intros.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.headline.toLowerCase().includes(search.toLowerCase())) return false;
    const themeVals = filterValues.theme ?? [];
    if (themeVals.length > 0 && !themeVals.includes(i.theme)) return false;
    const statusVals = filterValues.status ?? [];
    if (statusVals.length > 0) {
      if (statusVals.includes("template") && !i.isTemplate) return false;
      if (statusVals.includes("custom") && i.isTemplate) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "used") return b.used - a.used;
    return 0;
  });

  const handleDuplicate = (id: number) => {
    const intro = intros.find(i => i.id === id);
    if (!intro) return;
    const copy = { ...intro, id: Date.now(), name: `${intro.name} (Duplicate)`, used: 0, starred: false, isTemplate: false };
    setIntros(prev => [copy, ...prev]);
    show(`"${intro.name}" duplicated`, "success");
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const intro = intros.find(i => i.id === id);
    setIntros(prev => prev.filter(i => i.id !== id));
    show(`"${intro?.name}" deleted`, "success");
    setDeleteConfirm(null);
  };

  const toggleStar = (id: number) => {
    setIntros(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i));
  };

  const toggleTemplate = (id: number) => {
    const intro = intros.find(i => i.id === id);
    if (!intro) return;
    setIntros(prev => prev.map(i => i.id === id ? { ...i, isTemplate: !i.isTemplate } : i));
    show(intro.isTemplate ? `"${intro.name}" removed from templates` : `"${intro.name}" promoted to template`, "success");
    setMenuOpen(null);
  };

  const preview = previewId ? intros.find(i => i.id === previewId) : null;

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "Intros & Intro Templates" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Intros & Intro Templates</h1>
          <p className="text-[13px] text-tv-text-secondary mt-1">Manage themed intro slideshows with photos, text, color palettes, and music for your campaign videos.</p>
        </div>
        <button
          onClick={() => navigate("/assets/intros/create")}
          className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors shrink-0"
        >
          <Plus size={15} />New Intro
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={INTRO_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort intros" style={{ color: TV.brand }}>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search intros..." aria-label="Search intros" className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-decorative focus-visible:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">{filtered.length} intro{filtered.length !== 1 ? "s" : ""}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
            <Clapperboard size={22} className="text-tv-text-decorative" />
          </div>
          <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No intros found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(intro => {
            const theme = themeInfo(intro.theme);
            return (
              <div role="button" tabIndex={0} key={intro.id} onClick={() => setPreviewId(intro.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(intro.id); }}} aria-label={`Preview: ${intro.name}`} className="bg-white rounded-xl border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer text-left">
                {/* Thumbnail */}
                <div className={`h-32 bg-gradient-to-br ${intro.gradient} relative overflow-hidden`}>
                  {intro.backgroundImage ? (
                    <ImageWithFallback src={intro.backgroundImage} alt={intro.name} className="w-full h-full object-cover opacity-50" />
                  ) : null}
                  {/* Headline overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                    <p className="text-[14px] font-black text-white drop-shadow-lg leading-tight">{intro.headline}</p>
                  </div>
                  {/* Play hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                      <Play size={14} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  {/* Duration */}
                  <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">{intro.duration}</span>
                  {/* Theme badge */}
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/90" style={{ color: theme.color }}>
                    {theme.label}
                  </span>
                  {/* Template badge */}
                  {intro.isTemplate && (
                    <span className="absolute top-8 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-tv-brand-tint text-tv-text-brand">
                      Template
                    </span>
                  )}
                  {/* Star */}
                  <button onClick={(e) => { e.stopPropagation(); toggleStar(intro.id); }} aria-label={intro.starred ? "Unstar" : "Star"} className="absolute top-2 right-2 z-10 p-1 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
                    <Star size={13} className={intro.starred ? "text-tv-star fill-tv-star" : "text-white/70"} />
                  </button>
                </div>

                <div className="p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-tv-text-primary truncate">{intro.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary">
                          <Music size={9} />{intro.musicTrack}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary">
                          <ImageIcon size={9} />{intro.backgroundImage ? "Custom image" : "No image"}
                        </span>
                      </div>
                    </div>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setMenuOpen(menuOpen === intro.id ? null : intro.id)} aria-label="More actions" className="p-1 rounded hover:bg-tv-surface transition-colors">
                        <MoreHorizontal size={13} className="text-tv-text-secondary" />
                      </button>
                      {menuOpen === intro.id && (
                        <AssetActionMenu
                          onClose={() => setMenuOpen(null)}
                          actions={[
                            { icon: <Eye size={12} />, label: "Preview", onClick: () => { setPreviewId(intro.id); setMenuOpen(null); } },
                            { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(`/intro/create?edit=${intro.id}`); setMenuOpen(null); } },
                            { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(intro.id) },
                            { icon: <BookmarkPlus size={12} />, label: intro.isTemplate ? "Remove Template Status" : "Promote to Template", onClick: () => toggleTemplate(intro.id) },
                            { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(intro.id); setMenuOpen(null); }, danger: true },
                          ]}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-tv-text-secondary">
                    <span>{intro.updated}</span>
                    <span>Used {intro.used}x</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {preview && (() => {
        const pTheme = themeInfo(preview.theme);
        return (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setPreviewId(null)} />
            <div className="fixed inset-0 flex items-center justify-center z-[61] pointer-events-none p-4">
              <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider">
                  <div>
                    <p className="text-[14px] font-semibold text-tv-text-primary">{preview.name}</p>
                    <p className="text-[11px] text-tv-text-secondary">{pTheme.label} theme &middot; {preview.duration}</p>
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
                            { icon: <Pencil size={12} />, label: "Edit", onClick: () => { navigate(`/intro/create?edit=${preview.id}`); setModalMenuOpen(false); } },
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
                  {preview.backgroundImage ? (
                    <ImageWithFallback src={preview.backgroundImage} alt={preview.name} className="w-full h-full object-cover opacity-50" />
                  ) : null}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <p className="text-[22px] font-black text-white drop-shadow-lg mb-3">{preview.headline}</p>
                    <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                      <Play size={24} className="text-white ml-1" fill="white" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded font-mono">{preview.duration}</span>
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90" style={{ color: pTheme.color }}>
                    {pTheme.label} Theme
                  </span>
                </div>
                {/* Details */}
                <div className="px-5 py-4 space-y-2 border-b border-tv-border-divider">
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="flex items-center gap-1.5 text-tv-text-secondary"><Type size={11} />Headline:</span>
                    <span className="font-medium text-tv-text-primary">{preview.headline}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="flex items-center gap-1.5 text-tv-text-secondary"><Music size={11} />Music:</span>
                    <span className="font-medium text-tv-text-primary">{preview.musicTrack}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="flex items-center gap-1.5 text-tv-text-secondary"><ImageIcon size={11} />Background:</span>
                    <span className="font-medium text-tv-text-primary">{preview.backgroundImage ? "Custom image" : "No image"}</span>
                  </div>
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
            </div>
          </>
        );
      })()}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <DeleteModal
          title="Delete this intro?"
          description="This action cannot be undone. Campaigns already using this intro will not be affected."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}