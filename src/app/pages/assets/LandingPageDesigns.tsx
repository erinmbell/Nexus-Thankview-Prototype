import React, { useState } from "react";
import {
  Plus, Search, Eye, Copy, Trash2, MoreHorizontal,
  Star, Send, Pencil, X, Globe, ExternalLink, Play,
  Navigation, Image as ImageIcon, Palette, MousePointerClick,
  MessageSquare, Bookmark, Share2, Tag, Check, XCircle, ArrowUpDown,
  Layout,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useToast } from "../../contexts/ToastContext";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { AssetActionMenu } from "../../components/ui/AssetActionMenu";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FilterBar } from "../../components/FilterBar";
import type { FilterDef, FilterValues } from "../../components/FilterBar";
import { DATE_CREATED_FILTER, CREATED_BY_FILTER } from "../../components/filterDefs";
import { Menu, ActionIcon, Tooltip, Text, FocusTrap } from "@mantine/core";
import { TV } from "../../theme";

// ── Data model ─────────────────────────────────────────────────────────────
interface ButtonStyle {
  bg: string;
  text: string;
}

interface LandingPage {
  id: number;
  name: string;
  navBarColor: string;
  navBarLogo: "portal" | "shield" | "wordmark" | "none";
  bgImage: string;          // full background image URL
  bgGradient: boolean;
  blocks: string[];
  ctaLabel: string;
  ctaButton: ButtonStyle;
  secondaryButton: ButtonStyle;
  replyButton: ButtonStyle;
  saveButton: ButtonStyle;
  shareButton: ButtonStyle;
  url: string;
  updated: string;
  views: number;
  conversions: number;
  starred: boolean;
  thumb: string;            // card thumbnail (can differ from bgImage)
}

const LOGO_LABELS: Record<string, string> = {
  portal: "Portal Logo (default)",
  shield: "Shield Crest",
  wordmark: "Wordmark",
  none: "No logo",
};

const LANDING_PAGES: LandingPage[] = [
  {
    id: 1, name: "Annual Fund Thank You",
    navBarColor: "#7c45b0", navBarLogo: "portal",
    bgImage: "https://images.unsplash.com/photo-1766459842752-e06f749c0b54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwZ3JlZW58ZW58MXx8fHwxNzcxODg1MTIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    bgGradient: true,
    blocks: ["Hero Video", "Headline", "Story", "CTA"],
    ctaLabel: "Give to the Annual Fund",
    ctaButton: { bg: "#7c45b0", text: "#ffffff" },
    secondaryButton: { bg: "#1e3a8a", text: "#ffffff" },
    replyButton: { bg: "#7c45b0", text: "#ffffff" },
    saveButton: { bg: "#15803d", text: "#ffffff" },
    shareButton: { bg: "#0e7490", text: "#ffffff" },
    url: "thankview.com/hartwell/annual-fund",
    updated: "Feb 20, 2026", views: 1842, conversions: 312, starred: true,
    thumb: "https://images.unsplash.com/photo-1766459842752-e06f749c0b54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwZ3JlZW58ZW58MXx8fHwxNzcxODg1MTIwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2, name: "Scholarship Impact Story",
    navBarColor: "#1e3a8a", navBarLogo: "shield",
    bgImage: "https://images.unsplash.com/photo-1744320911030-1ab998d994d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvbGFyc2hpcCUyMHN0dWRlbnQlMjBwb3J0cmFpdCUyMGRpdmVyc2V8ZW58MXx8fHwxNzcxODg1MTIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    bgGradient: true,
    blocks: ["Hero Video", "Headline", "Fund Context", "Story", "CTA", "Reply"],
    ctaLabel: "Support Scholarships",
    ctaButton: { bg: "#1e3a8a", text: "#ffffff" },
    secondaryButton: { bg: "#7c45b0", text: "#ffffff" },
    replyButton: { bg: "#1e3a8a", text: "#ffffff" },
    saveButton: { bg: "#15803d", text: "#ffffff" },
    shareButton: { bg: "#0e7490", text: "#ffffff" },
    url: "thankview.com/hartwell/scholarships",
    updated: "Feb 18, 2026", views: 967, conversions: 184, starred: true,
    thumb: "https://images.unsplash.com/photo-1744320911030-1ab998d994d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvbGFyc2hpcCUyMHN0dWRlbnQlMjBwb3J0cmFpdCUyMGRpdmVyc2V8ZW58MXx8fHwxNzcxODg1MTIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3, name: "New Student Welcome",
    navBarColor: "#15803d", navBarLogo: "wordmark",
    bgImage: "https://images.unsplash.com/photo-1653250198948-1405af521dbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VsZWJyYXRpb24lMjBzdHVkZW50c3xlbnwxfHx8fDE3NzE4MDAyOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    bgGradient: false,
    blocks: ["Hero Video", "Headline", "CTA"],
    ctaLabel: "Watch Welcome Message",
    ctaButton: { bg: "#15803d", text: "#ffffff" },
    secondaryButton: { bg: "#0e7490", text: "#ffffff" },
    replyButton: { bg: "#15803d", text: "#ffffff" },
    saveButton: { bg: "#15803d", text: "#ffffff" },
    shareButton: { bg: "#0e7490", text: "#ffffff" },
    url: "thankview.com/hartwell/welcome-2026",
    updated: "Feb 14, 2026", views: 2410, conversions: 0, starred: false,
    thumb: "https://images.unsplash.com/photo-1653250198948-1405af521dbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VsZWJyYXRpb24lMjBzdHVkZW50c3xlbnwxfHx8fDE3NzE4MDAyOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4, name: "Matching Gift Challenge",
    navBarColor: "#7c45b0", navBarLogo: "portal",
    bgImage: "https://images.unsplash.com/photo-1593177089554-aeafc99049fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBhdXR1bW4lMjBicmlja3xlbnwxfHx8fDE3NzE4ODUxMjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    bgGradient: false,
    blocks: ["Headline", "Fund Context", "CTA"],
    ctaLabel: "Double My Gift",
    ctaButton: { bg: "#b45309", text: "#ffffff" },
    secondaryButton: { bg: "#7c45b0", text: "#ffffff" },
    replyButton: { bg: "#b45309", text: "#ffffff" },
    saveButton: { bg: "#15803d", text: "#ffffff" },
    shareButton: { bg: "#0e7490", text: "#ffffff" },
    url: "thankview.com/hartwell/match-2026",
    updated: "Feb 10, 2026", views: 534, conversions: 89, starred: false,
    thumb: "https://images.unsplash.com/photo-1593177089554-aeafc99049fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwYnVpbGRpbmclMjBhdXR1bW4lMjBicmlja3xlbnwxfHx8fDE3NzE4ODUxMjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5, name: "Endowment Report Landing",
    navBarColor: "#1a1a2e", navBarLogo: "shield",
    bgImage: "https://images.unsplash.com/photo-1718327453695-4d32b94c90a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwbGlicmFyeSUyMHN0dWR5JTIwYm9va3N8ZW58MXx8fHwxNzcxODg1MTI0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    bgGradient: true,
    blocks: ["Hero Video", "Headline", "Story", "Fund Context"],
    ctaLabel: "View Your Report",
    ctaButton: { bg: "#8b5cf6", text: "#ffffff" },
    secondaryButton: { bg: "#1e3a8a", text: "#ffffff" },
    replyButton: { bg: "#8b5cf6", text: "#ffffff" },
    saveButton: { bg: "#15803d", text: "#ffffff" },
    shareButton: { bg: "#0e7490", text: "#ffffff" },
    url: "thankview.com/hartwell/endowment",
    updated: "Jan 28, 2026", views: 223, conversions: 0, starred: false,
    thumb: "https://images.unsplash.com/photo-1718327453695-4d32b94c90a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwbGlicmFyeSUyMHN0dWR5JTIwYm9va3N8ZW58MXx8fHwxNzcxODg1MTI0fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 6, name: "Board Thank You",
    navBarColor: "#374151", navBarLogo: "none",
    bgImage: "https://images.unsplash.com/photo-1553397279-5b10b6c39f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFuayUyMHlvdSUyMGhhbmR3cml0dGVuJTIwbm90ZSUyMGNhcmQ8ZW58MXx8fHwxNzcxODg1MTIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    bgGradient: false,
    blocks: ["Hero Video", "Headline", "Reply"],
    ctaLabel: "Share Your Thoughts",
    ctaButton: { bg: "#dc2626", text: "#ffffff" },
    secondaryButton: { bg: "#374151", text: "#ffffff" },
    replyButton: { bg: "#dc2626", text: "#ffffff" },
    saveButton: { bg: "#15803d", text: "#ffffff" },
    shareButton: { bg: "#0e7490", text: "#ffffff" },
    url: "thankview.com/hartwell/board-thanks",
    updated: "Jan 20, 2026", views: 44, conversions: 12, starred: false,
    thumb: "https://images.unsplash.com/photo-1553397279-5b10b6c39f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFuayUyMHlvdSUyMGhhbmR3cml0dGVuJTIwbm90ZSUyMGNhcmQ8ZW58MXx8fHwxNzcxODg1MTIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const LANDING_PAGE_FILTERS: FilterDef[] = [
  {
    key: "logo", label: "Nav Logo", icon: Layout, group: "Logo",
    type: "select", essential: true,
    options: [
      { value: "portal", label: "Portal Logo" },
      { value: "shield", label: "Shield Crest" },
      { value: "wordmark", label: "Wordmark" },
      { value: "none", label: "No Logo" },
    ],
  },
  {
    key: "gradient", label: "Gradient", icon: Palette, group: "Style",
    type: "select",
    options: [
      { value: "yes", label: "Has Gradient" },
      { value: "no", label: "No Gradient" },
    ],
  },
  DATE_CREATED_FILTER,
  CREATED_BY_FILTER,
];

// ═══════════════════════════════════════════════════════════════════════════
export function LandingPageDesigns() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    LANDING_PAGE_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [sortBy, setSortBy] = useState<"recent" | "name" | "views">("recent");
  const [pages, setPages] = useState(LANDING_PAGES);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);

  const filtered = pages.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    const logoVals = filterValues.logo ?? [];
    if (logoVals.length > 0 && !logoVals.includes(p.navBarLogo)) return false;
    const gradVals = filterValues.gradient ?? [];
    if (gradVals.length > 0) {
      if (gradVals.includes("yes") && !p.bgGradient) return false;
      if (gradVals.includes("no") && p.bgGradient) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "views") return b.views - a.views;
    return 0;
  });

  const handleDuplicate = (id: number) => {
    const pg = pages.find(p => p.id === id);
    if (!pg) return;
    const copy: LandingPage = {
      ...pg,
      id: Date.now(),
      name: `${pg.name} (Duplicate)`,
      views: 0,
      conversions: 0,
      starred: false,
      updated: "Feb 26, 2026",
    };
    setPages(prev => [copy, ...prev]);
    show(`"${pg.name}" duplicated with all settings`, "success");
    setMenuOpen(null);
  };

  const handleCopyToBuilder = (id: number) => {
    navigate(`/landing?id=${id}&copy=true&from=library`);
  };

  const handleDelete = (id: number) => {
    const pg = pages.find(p => p.id === id);
    setPages(prev => prev.filter(p => p.id !== id));
    show(`"${pg?.name}" deleted`, "success");
    setDeleteConfirm(null);
    if (previewId === id) setPreviewId(null);
  };

  const toggleStar = (id: number) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p));
  };

  const preview = previewId ? pages.find(p => p.id === previewId) : null;

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "Landing Page Designs" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Landing Page Designs</h1>
          <p className="text-[13px] text-tv-text-secondary mt-1">Build and manage custom landing pages for your video campaigns.</p>
        </div>
        <button
          onClick={() => navigate("/landing?from=library")}
          className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand-hover transition-colors shrink-0"
        >
          <Plus size={15} />New Landing Page
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={LANDING_PAGE_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort landing pages" style={{ color: TV.brand }}>
                    <ArrowUpDown size={14} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Sort by</Menu.Label>
                {([
                  { key: "recent" as const, label: "Most Recent" },
                  { key: "name" as const, label: "Name A–Z" },
                  { key: "views" as const, label: "Most Views" },
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
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-tv-border-light max-w-[255px]">
          <Search size={13} className="text-tv-text-secondary shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search landing pages…" aria-label="Search landing pages" className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-decorative focus-visible:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">{filtered.length} page{filtered.length !== 1 ? "s" : ""}</p>

      {/* Page cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
            <Globe size={22} className="text-tv-text-decorative" />
          </div>
          <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No landing pages found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(pg => (
            <div role="button" tabIndex={0} key={pg.id} onClick={() => setPreviewId(pg.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(pg.id); }}} aria-label={`Preview: ${pg.name}`} className="bg-white rounded-xl border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer text-left">
              {/* Thumbnail */}
              <div className="h-40 relative overflow-hidden bg-tv-surface">
                <ImageWithFallback src={pg.thumb} alt={pg.name} className="w-full h-full object-cover" />
                {/* Nav bar color accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: pg.navBarColor }} />
                {/* Gradient overlay indicator */}
                {pg.bgGradient && <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />}
                {/* Star */}
                <button onClick={(e) => { e.stopPropagation(); toggleStar(pg.id); }} aria-label={pg.starred ? "Unstar" : "Star"} className="absolute top-3 right-2 z-10 p-1 bg-black/30 rounded-full hover:bg-black/50 transition-colors">
                  <Star size={13} className={pg.starred ? "text-tv-star fill-tv-star" : "text-white/70"} />
                </button>
                {/* Block count */}
                <span className="absolute bottom-3 left-3 bg-white/90 text-[10px] font-semibold text-tv-text-primary px-2 py-0.5 rounded-full shadow-sm">
                  {pg.blocks.length} blocks
                </span>
                {/* Logo badge */}
                <span className="absolute top-3 left-2 bg-white/90 text-[9px] font-bold text-tv-brand px-2 py-0.5 rounded-full shadow-sm">
                  {pg.navBarLogo === "none" ? "No logo" : pg.navBarLogo === "portal" ? "Portal Logo" : LOGO_LABELS[pg.navBarLogo]}
                </span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-tv-text-primary truncate">{pg.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: pg.navBarColor }} />
                      <span className="text-[10px] text-tv-text-secondary truncate">{pg.url}</span>
                    </div>
                  </div>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === pg.id ? null : pg.id)} aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen === pg.id} className="p-1 rounded hover:bg-tv-surface transition-colors">
                      <MoreHorizontal size={14} className="text-tv-text-secondary" />
                    </button>
                    {menuOpen === pg.id && (
                      <AssetActionMenu
                        width={200}
                        onClose={() => setMenuOpen(null)}
                        actions={[
                          { icon: <Eye size={12} />, label: "View details", onClick: () => { setPreviewId(pg.id); setMenuOpen(null); } },
                          { icon: <Pencil size={12} />, label: "Edit in Builder", onClick: () => { navigate(`/landing?id=${pg.id}&from=library`); setMenuOpen(null); } },
                          { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(pg.id) },
                          { icon: <Palette size={12} />, label: "Duplicate & edit in Builder", onClick: () => { handleCopyToBuilder(pg.id); setMenuOpen(null); } },
                          { icon: <ExternalLink size={12} />, label: "Copy URL", onClick: () => { show("Link copied to clipboard", "success"); setMenuOpen(null); } },
                          { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(pg.id); setMenuOpen(null); }, danger: true },
                        ]}
                      />
                    )}
                  </div>
                </div>

                {/* Button color dots — labeled */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {([
                    { key: "cta", label: "CTA", style: pg.ctaButton },
                    { key: "secondary", label: "2nd", style: pg.secondaryButton },
                    { key: "reply", label: "Reply", style: pg.replyButton },
                    { key: "save", label: "Save", style: pg.saveButton },
                    { key: "share", label: "Share", style: pg.shareButton },
                  ] as const).map(btn => (
                    <div key={btn.key} className="inline-flex items-center gap-1 text-[9px] text-tv-text-secondary" title={`${btn.label} button: bg ${btn.style.bg}, text ${btn.style.text}`}>
                      <div className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: btn.style.bg }} />
                      <span>{btn.label}</span>
                    </div>
                  ))}
                  <span className="text-[9px] text-tv-text-secondary ml-0.5">· {pg.bgGradient ? "Gradient" : "No gradient"}</span>
                </div>

                {/* Blocks preview */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {pg.blocks.map(b => (
                    <span key={b} className="inline-flex items-center whitespace-nowrap text-[9px] font-medium px-1.5 py-0.5 rounded bg-tv-surface text-tv-text-secondary border border-tv-border-light">{b}</span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-[11px] text-tv-text-secondary mb-3">
                  <span>{pg.views.toLocaleString()} views</span>
                  <span>{pg.conversions} conversions</span>
                  <span className="ml-auto">{pg.updated}</span>
                </div>

                {/* CTA bar */}
                <div className="flex items-center gap-2 p-2 bg-tv-surface-muted rounded-md border border-tv-border-divider">
                  <div className="h-6 flex-1 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: pg.ctaButton.bg, color: pg.ctaButton.text }}>{pg.ctaLabel}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail / Preview modal ─────────────────────────────────────── */}
      {preview && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setPreviewId(null); setModalMenuOpen(false); }} />
          <div className="fixed inset-0 flex items-center justify-center z-[61] pointer-events-none p-4" role="dialog" aria-modal="true" aria-label={`Preview: ${preview.name}`} onKeyDown={(e) => { if (e.key === "Escape") { setPreviewId(null); setModalMenuOpen(false); } }}>
            <FocusTrap active>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider sticky top-0 bg-white z-10">
                <h2 className="text-[16px] font-black text-tv-text-primary truncate pr-3">{preview.name}</h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleStar(preview.id)} className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center hover:bg-tv-surface-hover transition-colors">
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
                          { icon: <Pencil size={12} />, label: "Edit in Builder", onClick: () => { navigate(`/landing?id=${preview.id}&from=library`); setModalMenuOpen(false); setPreviewId(null); } },
                          { icon: <Copy size={12} />, label: "Duplicate", onClick: () => { handleDuplicate(preview.id); setModalMenuOpen(false); } },
                          { icon: <Palette size={12} />, label: "Duplicate & edit in Builder", onClick: () => { handleCopyToBuilder(preview.id); setModalMenuOpen(false); setPreviewId(null); } },
                          { icon: <ExternalLink size={12} />, label: "Copy URL", onClick: () => { show("Link copied to clipboard", "success"); setModalMenuOpen(false); } },
                          { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(preview.id); setPreviewId(null); setModalMenuOpen(false); }, danger: true },
                        ]}
                      />
                    )}
                  </div>
                  <button onClick={() => { setPreviewId(null); setModalMenuOpen(false); }} aria-label="Close preview" className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover"><X size={13} /></button>
                </div>
              </div>

              {/* ── Landing page visual preview ── */}
              <div className="bg-white border-b border-tv-border-light">
                {/* Nav bar preview */}
                <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: preview.navBarColor }}>
                  {preview.navBarLogo !== "none" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                      {preview.navBarLogo === "portal" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="2" /><circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" /><line x1="12" y1="3" x2="12" y2="8" stroke="white" strokeWidth="1.5" /><line x1="12" y1="16" x2="12" y2="21" stroke="white" strokeWidth="1.5" /></svg>
                      ) : preview.navBarLogo === "shield" ? (
                        <svg width="12" height="14" viewBox="0 0 16 20" fill="none"><path d="M8 1L15 5V10C15 15.5 8 19 8 19C8 19 1 15.5 1 10V5L8 1Z" stroke="white" strokeWidth="1.5" /><text x="8" y="13" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">H</text></svg>
                      ) : (
                        <span className="text-[8px] font-bold tracking-wider text-white">HU</span>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-white truncate">Hartwell University</p>
                    <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.7)" }}>thankview.com</p>
                  </div>
                </div>

                {/* Background image + hero */}
                <div className="relative h-32 overflow-hidden bg-tv-surface">
                  {preview.bgImage ? (
                    <>
                      <img src={preview.bgImage} alt="Background" className="w-full h-full object-cover" />
                      {preview.bgGradient && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-tv-text-decorative">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {preview.blocks.includes("Hero Video") && (
                      <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Mini CTA + buttons preview */}
                <div className="p-4 space-y-3">
                  {preview.blocks.includes("Headline") && (
                    <div className="text-center">
                      <p className="text-[14px] font-black text-tv-text-primary font-display">Your gift is changing lives.</p>
                      <p className="text-[10px] text-tv-text-secondary mt-0.5">A personal thank you from Kelley Molt.</p>
                    </div>
                  )}
                  {preview.blocks.includes("CTA") && (
                    <button className="w-full py-2 rounded-full text-[11px] font-bold" style={{ backgroundColor: preview.ctaButton.bg, color: preview.ctaButton.text }}>{preview.ctaLabel}</button>
                  )}
                  {/* Action buttons row */}
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-[9px] font-semibold" style={{ backgroundColor: preview.secondaryButton.bg, color: preview.secondaryButton.text }}>Learn More</span>
                    <span className="px-3 py-1 rounded-full text-[9px] font-semibold inline-flex items-center gap-1" style={{ backgroundColor: preview.replyButton.bg, color: preview.replyButton.text }}><MessageSquare size={8} />Reply</span>
                    <span className="px-3 py-1 rounded-full text-[9px] font-semibold inline-flex items-center gap-1" style={{ backgroundColor: preview.saveButton.bg, color: preview.saveButton.text }}><Bookmark size={8} />Save</span>
                    <span className="px-3 py-1 rounded-full text-[9px] font-semibold inline-flex items-center gap-1" style={{ backgroundColor: preview.shareButton.bg, color: preview.shareButton.text }}><Share2 size={8} />Share</span>
                  </div>
                </div>
                <div className="px-4 pb-3 pt-1 border-t border-tv-border-divider">
                  <p className="text-[8px] text-center text-tv-text-decorative">Powered by ThankView · thankview.com</p>
                </div>
              </div>

              {/* ── Properties table ──────────────────────────────────── */}
              <div className="px-5 py-4 space-y-5">

                {/* ── Page Details ──────────────────────────────────── */}
                <div>
                  <SectionHeader icon={<Tag size={12} />} label="Page Details" />
                  <div className="mt-2 space-y-0">
                    <PropRow label="Title" value={preview.name} />
                    <PropRow label="URL" value={preview.url} mono />
                    <PropRow label="CTA label" value={preview.ctaLabel} />
                    <PropRow label="Content blocks" value={preview.blocks.join(", ")} />
                    <PropRow label="Last updated" value={preview.updated} />
                    <PropRow label="Views" value={preview.views.toLocaleString()} />
                    <PropRow label="Conversions" value={String(preview.conversions)} />
                  </div>
                </div>

                {/* ── Nav Bar ──────────────────────────────────────── */}
                <div>
                  <SectionHeader icon={<Navigation size={12} />} label="Nav Bar" />
                  <div className="mt-2 space-y-0">
                    <PropColor label="Nav bar color" color={preview.navBarColor} />
                    <PropRow label="Nav bar logo" value={LOGO_LABELS[preview.navBarLogo]} />
                    {preview.navBarLogo === "portal" && (
                      <div className="flex items-center justify-between py-1.5 border-b border-tv-border-divider">
                        <span className="text-[12px] text-tv-text-secondary">Logo note</span>
                        <span className="text-[12px] text-tv-text-label italic">Uses Portal Logo (default)</span>
                      </div>
                    )}
                    {preview.navBarLogo === "none" && (
                      <div className="flex items-center justify-between py-1.5 border-b border-tv-border-divider">
                        <span className="text-[12px] text-tv-text-secondary">Logo note</span>
                        <span className="text-[12px] text-tv-text-label italic">No logo — text only</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Background ───────────────────────────────────── */}
                <div>
                  <SectionHeader icon={<ImageIcon size={12} />} label="Background" />
                  <div className="mt-2 space-y-0">
                    {/* Background image thumbnail */}
                    <div className="flex items-center justify-between py-2 border-b border-tv-border-divider">
                      <span className="text-[12px] text-tv-text-secondary">Background image</span>
                      {preview.bgImage ? (
                        <div className="w-16 h-10 rounded-sm border border-tv-border-light overflow-hidden shrink-0">
                          <img src={preview.bgImage} alt="Background" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-[12px] text-tv-text-label italic">No image</span>
                      )}
                    </div>
                    <PropBool label="Gradient overlay" value={preview.bgGradient} />
                  </div>
                </div>

                {/* ── Button Colors ─────────────────────────────────── */}
                <div>
                  <SectionHeader icon={<Palette size={12} />} label="Button Colors" />
                  <div className="mt-2 space-y-0">
                    <ButtonColorRow icon={<MousePointerClick size={11} />} label="Call to Action" style={preview.ctaButton} />
                    <ButtonColorRow icon={<ExternalLink size={11} />} label="Secondary" style={preview.secondaryButton} />
                    <ButtonColorRow icon={<MessageSquare size={11} />} label="Reply" style={preview.replyButton} />
                    <ButtonColorRow icon={<Bookmark size={11} />} label="Save" style={preview.saveButton} />
                    <ButtonColorRow icon={<Share2 size={11} />} label="Share" style={preview.shareButton} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 flex gap-2 border-t border-tv-border-divider">
                <button onClick={() => { setPreviewId(null); navigate(`/landing?id=${preview.id}&from=library`); }} className="flex-1 py-2.5 border border-tv-brand-bg text-tv-brand rounded-full text-[12px] font-semibold hover:bg-tv-brand-tint transition-colors flex items-center justify-center gap-2">
                  <Pencil size={11} />Edit
                </button>
                <button onClick={() => { setPreviewId(null); handleCopyToBuilder(preview.id); }} className="flex-1 py-2.5 border border-tv-border-light text-tv-text-secondary rounded-full text-[12px] font-medium hover:bg-tv-surface transition-colors flex items-center justify-center gap-2">
                  <Copy size={11} />Duplicate &amp; Edit
                </button>
                <button onClick={() => { setPreviewId(null); navigate("/campaigns/create"); }} className="flex-1 py-2.5 bg-tv-brand-bg text-white rounded-full text-[12px] font-semibold hover:bg-tv-brand-hover transition-colors flex items-center justify-center gap-2">
                  <Send size={11} />Use
                </button>
              </div>
            </div>
            </FocusTrap>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <DeleteModal
          opened
          title="Delete this landing page?"
          description="This action cannot be undone. The URL will no longer be accessible."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Property display helpers ──────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-tv-border-light">
      <div className="w-5 h-5 rounded-[5px] bg-tv-brand-tint flex items-center justify-center text-tv-text-brand shrink-0">{icon}</div>
      <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider">{label}</p>
    </div>
  );
}

function PropRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-tv-border-divider">
      <span className="text-[12px] text-tv-text-secondary">{label}</span>
      <span className={`text-[12px] text-tv-text-primary font-medium text-right max-w-[60%] truncate ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function PropColor({ label, color }: { label: string; color: string }) {
  const isWhite = color.toLowerCase() === "#ffffff";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-tv-border-divider">
      <span className="text-[12px] text-tv-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-tv-border-light shrink-0 relative overflow-hidden" style={{ backgroundColor: color }}>
          {isWhite && (
            <div className="absolute inset-0 -z-10" style={{ backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)", backgroundSize: "6px 6px", backgroundPosition: "0 0, 3px 3px" }} />
          )}
        </div>
        <span className="text-[12px] font-mono text-tv-text-primary">{color}</span>
        {isWhite && <span className="text-[10px] text-tv-text-secondary italic">White</span>}
      </div>
    </div>
  );
}

function PropBool({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-tv-border-divider">
      <span className="text-[12px] text-tv-text-secondary">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${value ? "text-tv-success" : "text-tv-text-secondary"}`}>
        {value ? <Check size={12} className="text-tv-success" /> : <XCircle size={12} className="text-tv-text-decorative" />}
        {value ? "On" : "Off"}
      </span>
    </div>
  );
}

function ButtonColorRow({ icon, label, style }: { icon: React.ReactNode; label: string; style: ButtonStyle }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-tv-border-divider">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-tv-brand shrink-0">{icon}</span>
        <span className="text-[12px] text-tv-text-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {/* Button bg */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-tv-text-secondary">BG</span>
          <div className="w-4 h-4 rounded border border-tv-border-light shrink-0" style={{ backgroundColor: style.bg }} />
          <span className="text-[11px] font-mono text-tv-text-primary">{style.bg}</span>
        </div>
        {/* Separator */}
        <span className="text-[10px] text-tv-text-decorative">/</span>
        {/* Button text */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-tv-text-secondary">Text</span>
          <div className="w-4 h-4 rounded border border-tv-border-light shrink-0 relative overflow-hidden" style={{ backgroundColor: style.text }}>
            {/* Checkerboard behind white swatches so they're visible */}
            {style.text.toLowerCase() === "#ffffff" && (
              <div className="absolute inset-0 -z-10" style={{ backgroundImage: "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)", backgroundSize: "6px 6px", backgroundPosition: "0 0, 3px 3px" }} />
            )}
          </div>
          <span className="text-[11px] font-mono text-tv-text-primary">{style.text}</span>
        </div>
      </div>
    </div>
  );
}