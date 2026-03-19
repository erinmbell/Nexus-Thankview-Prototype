import React, { useState } from "react";
import {
  Plus, Search, Mail, Copy, Trash2, MoreHorizontal,
  Eye, Star, Send, Pencil, X, Palette, Landmark, Leaf, GraduationCap, Heart,
  Stamp as StampIcon, Image as ImageIcon, Tag, ArrowUpDown,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useToast } from "../../contexts/ToastContext";
import { DeleteModal } from "../../components/ui/DeleteModal";
import { AssetActionMenu } from "../../components/ui/AssetActionMenu";
import { EnvelopePreview } from "../../components/EnvelopePreview";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FilterBar } from "../../components/FilterBar";
import type { FilterDef, FilterValues } from "../../components/FilterBar";
import { DATE_CREATED_FILTER, CREATED_BY_FILTER } from "../../components/filterDefs";
import { Menu, ActionIcon, Tooltip, Text } from "@mantine/core";
import { TV } from "../../theme";

// ── Data model matching EnvelopeBuilder.tsx ────────────────────────────────
interface EnvelopeData {
  id: number;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  envelopeColor: string;
  linerColor: string;
  recipientNameColor: string;
  frontDesign: "none" | "swoops" | "stripes";
  frontDesignColor: string;
  frontLeftLogo: "none" | "shield" | "wordmark" | "seal";
  backFlapLogo: "none" | "shield" | "wordmark" | "seal";
  postmarkColor: string;
  postmarkCopy: string;
  stampSelection: "classic" | "forever" | "university" | "heart";
  category: "Branded" | "Holiday" | "Legacy";
  updated: string;
  used: number;
  starred: boolean;
}

const STAMP_LABELS: Record<string, string> = { classic: "Classic", forever: "Forever", university: "University", heart: "Heart" };
const STAMP_ICONS: Record<string, React.ReactNode> = {
  classic: <Landmark size={10} />,
  forever: <Leaf size={10} />,
  university: <GraduationCap size={10} />,
  heart: <Heart size={10} />,
};
const LOGO_LABELS: Record<string, string> = { none: "None", shield: "Shield Crest", wordmark: "Wordmark", seal: "University Seal" };

const ENVELOPES: EnvelopeData[] = [
  { id: 1, title: "Hartwell Navy — Formal", primaryColor: "#1B3461", secondaryColor: "#C8962A", tertiaryColor: "#6B1E33", envelopeColor: "#1B3461", linerColor: "#C8962A", recipientNameColor: "#FFFFFF", frontDesign: "swoops", frontDesignColor: "#C8962A", frontLeftLogo: "shield", backFlapLogo: "seal", postmarkColor: "#C8962A", postmarkCopy: "Hartwell University", stampSelection: "classic", category: "Branded", updated: "Feb 20, 2026", used: 18, starred: true },
  { id: 2, title: "Hartwell Gold — Donor", primaryColor: "#C8962A", secondaryColor: "#1B3461", tertiaryColor: "#6B1E33", envelopeColor: "#C8962A", linerColor: "#1B3461", recipientNameColor: "#1B3461", frontDesign: "stripes", frontDesignColor: "#1B3461", frontLeftLogo: "wordmark", backFlapLogo: "shield", postmarkColor: "#1B3461", postmarkCopy: "Donor Relations", stampSelection: "forever", category: "Branded", updated: "Feb 18, 2026", used: 12, starred: false },
  { id: 3, title: "Heritage Maroon — President", primaryColor: "#6B1E33", secondaryColor: "#C8962A", tertiaryColor: "#1B3461", envelopeColor: "#6B1E33", linerColor: "#C8962A", recipientNameColor: "#C8962A", frontDesign: "swoops", frontDesignColor: "#C8962A", frontLeftLogo: "seal", backFlapLogo: "wordmark", postmarkColor: "#C8962A", postmarkCopy: "Office of the President", stampSelection: "university", category: "Branded", updated: "Feb 14, 2026", used: 5, starred: true },
  { id: 4, title: "Holiday Red — Winter 2025", primaryColor: "#c41e3a", secondaryColor: "#14532d", tertiaryColor: "#C8962A", envelopeColor: "#c41e3a", linerColor: "#14532d", recipientNameColor: "#FFFFFF", frontDesign: "stripes", frontDesignColor: "#14532d", frontLeftLogo: "wordmark", backFlapLogo: "none", postmarkColor: "#14532d", postmarkCopy: "Happy Holidays", stampSelection: "heart", category: "Holiday", updated: "Dec 10, 2025", used: 24, starred: false },
  { id: 5, title: "Holiday Evergreen", primaryColor: "#14532d", secondaryColor: "#c41e3a", tertiaryColor: "#C8962A", envelopeColor: "#14532d", linerColor: "#c41e3a", recipientNameColor: "#FFFFFF", frontDesign: "swoops", frontDesignColor: "#c41e3a", frontLeftLogo: "shield", backFlapLogo: "shield", postmarkColor: "#c41e3a", postmarkCopy: "Season's Greetings", stampSelection: "heart", category: "Holiday", updated: "Dec 8, 2025", used: 15, starred: false },
  { id: 6, title: "Legacy Midnight — Endowment", primaryColor: "#1a1a2e", secondaryColor: "#C8962A", tertiaryColor: "#4A6280", envelopeColor: "#1a1a2e", linerColor: "#C8962A", recipientNameColor: "#C8962A", frontDesign: "none", frontDesignColor: "#C8962A", frontLeftLogo: "seal", backFlapLogo: "seal", postmarkColor: "#C8962A", postmarkCopy: "Endowment Office", stampSelection: "classic", category: "Legacy", updated: "Jan 20, 2026", used: 7, starred: false },
  { id: 7, title: "Legacy Slate — Board", primaryColor: "#374151", secondaryColor: "#C8962A", tertiaryColor: "#1B3461", envelopeColor: "#374151", linerColor: "#C8962A", recipientNameColor: "#FFFFFF", frontDesign: "stripes", frontDesignColor: "#C8962A", frontLeftLogo: "wordmark", backFlapLogo: "wordmark", postmarkColor: "#C8962A", postmarkCopy: "Board of Trustees", stampSelection: "university", category: "Legacy", updated: "Jan 15, 2026", used: 3, starred: false },
  { id: 8, title: "True Purple — Default", primaryColor: "#7c45b0", secondaryColor: "#C8962A", tertiaryColor: "#1B3461", envelopeColor: "#7c45b0", linerColor: "#C8962A", recipientNameColor: "#FFFFFF", frontDesign: "swoops", frontDesignColor: "#C8962A", frontLeftLogo: "shield", backFlapLogo: "shield", postmarkColor: "#FFFFFF", postmarkCopy: "ThankView", stampSelection: "forever", category: "Branded", updated: "Feb 22, 2026", used: 32, starred: true },
];

const CATEGORIES = ["All", "Branded", "Holiday", "Legacy"];

// ── Helpers ────────────────────────────────────────────────────────────────
function ColorDot({ color, size = 10 }: { color: string; size?: number }) {
  return <div className="rounded-full shrink-0 shadow-sm border border-black/10" style={{ backgroundColor: color, width: size, height: size }} />;
}

const ENVELOPE_FILTERS: FilterDef[] = [
  {
    key: "category", label: "Category", icon: Tag, group: "Category",
    type: "select", essential: true,
    options: [
      { value: "Branded", label: "Branded" },
      { value: "Holiday", label: "Holiday" },
      { value: "Legacy", label: "Legacy" },
    ],
  },
  {
    key: "stamp", label: "Stamp", icon: StampIcon, group: "Stamp",
    type: "select",
    options: [
      { value: "classic", label: "Classic" },
      { value: "forever", label: "Forever" },
      { value: "university", label: "University" },
      { value: "heart", label: "Heart" },
    ],
  },
  DATE_CREATED_FILTER,
  CREATED_BY_FILTER,
];

// ═══════════════════════════════════════════════════════════════════════════
export function EnvelopeDesigns() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(
    ENVELOPE_FILTERS.filter(f => f.essential).map(f => f.key)
  );
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [envelopes, setEnvelopes] = useState(ENVELOPES);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);

  const filtered = envelopes.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    const catVals = filterValues.category ?? [];
    if (catVals.length > 0 && !catVals.includes(e.category)) return false;
    const stampVals = filterValues.stamp ?? [];
    if (stampVals.length > 0 && !stampVals.includes(e.stampSelection)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    if (sortBy === "used") return b.used - a.used;
    return 0;
  });

  // ── Copy: duplicates ALL fields ────────────────────────────────────────
  const handleDuplicate = (id: number) => {
    const env = envelopes.find(e => e.id === id);
    if (!env) return;
    const copy: EnvelopeData = {
      ...env,
      id: Date.now(),
      title: `${env.title} (Duplicate)`,
      used: 0,
      starred: false,
      updated: "Feb 26, 2026",
    };
    setEnvelopes(prev => [copy, ...prev]);
    show(`"${env.title}" duplicated with all settings`, "success");
    setMenuOpen(null);
  };

  // ── Copy to Builder: opens builder pre-filled with all fields ──────────
  const handleCopyToBuilder = (id: number) => {
    navigate(`/envelope?id=${id}&copy=true&from=library`);
  };

  const handleDelete = (id: number) => {
    const env = envelopes.find(e => e.id === id);
    setEnvelopes(prev => prev.filter(e => e.id !== id));
    show(`"${env?.title}" deleted`, "success");
    setDeleteConfirm(null);
  };

  const toggleStar = (id: number) => {
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  const preview = previewId ? envelopes.find(e => e.id === previewId) : null;

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Assets", href: "/assets" },
          { label: "Envelope Designs" },
        ]} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-black text-tv-text-primary">Envelope Designs</h1>
          <p className="text-[13px] text-tv-text-secondary mt-1">Design branded digital envelopes to wrap your video messages.</p>
        </div>
        <button
          onClick={() => navigate("/envelope")}
          className="flex items-center gap-2 bg-tv-brand-bg text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-tv-brand transition-colors shrink-0"
        >
          <Plus size={15} />New Envelope
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <FilterBar
          filters={ENVELOPE_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
          sortButton={
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size="lg" radius="xl" aria-label="Sort envelopes" style={{ color: TV.brand }}>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search envelopes…" aria-label="Search envelopes" className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-secondary focus-visible:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-[12px] text-tv-text-secondary mb-4">{filtered.length} envelope{filtered.length !== 1 ? "s" : ""}</p>

      {/* Envelope cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
            <Mail size={22} className="text-tv-text-decorative" />
          </div>
          <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No envelopes found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filtered.map(env => (
            <div key={env.id} role="button" tabIndex={0} onClick={() => setPreviewId(env.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPreviewId(env.id); }}} aria-label={`Preview: ${env.name}`} className="bg-white rounded-lg border border-tv-border-light overflow-hidden hover:shadow-md hover:border-tv-border-strong transition-all group cursor-pointer">
              {/* Envelope mini-preview */}
              <div className="relative flex items-center justify-center py-2.5 bg-[#f9f7fc]">
                <EnvelopePreview
                  envelopeColor={env.envelopeColor}
                  linerColor={env.linerColor}
                  frontDesign={env.frontDesign}
                  frontDesignColor={env.frontDesignColor}
                  primaryColor={env.primaryColor}
                  secondaryColor={env.secondaryColor}
                  tertiaryColor={env.tertiaryColor}
                  stampSelection={env.stampSelection}
                  postmarkColor={env.postmarkColor}
                  frontLeftLogo={env.frontLeftLogo}
                  mode="thumbnail"
                  width={170}
                />
                {/* Category badge */}
                <span className={`absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full z-10 ${
                  env.category === "Branded" ? "bg-tv-brand-tint text-tv-text-brand" :
                  env.category === "Holiday" ? "bg-[#fef2f2] text-[#c41e3a]" :
                  "bg-[#f0f0f8] text-[#374151]"
                }`}>{env.category}</span>
                {/* Star */}
                <button onClick={(e) => { e.stopPropagation(); toggleStar(env.id); }} aria-label={env.starred ? "Unstar" : "Star"} className="absolute top-1.5 right-1.5 z-10 p-0.5 bg-black/20 rounded-full hover:bg-black/40 transition-colors">
                  <Star size={12} className={env.starred ? "text-tv-star fill-tv-star" : "text-tv-text-secondary"} />
                </button>
              </div>

              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <p className="text-[12px] font-semibold text-tv-text-primary truncate flex-1 min-w-0">{env.title}</p>
                  <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === env.id ? null : env.id)} aria-label="More actions" className="p-0.5 rounded hover:bg-tv-surface transition-colors">
                      <MoreHorizontal size={13} className="text-tv-text-secondary" />
                    </button>
                    {menuOpen === env.id && (
                        <AssetActionMenu
                          width={200}
                          onClose={() => setMenuOpen(null)}
                          actions={[
                            { icon: <Eye size={12} />, label: "View details", onClick: () => { setPreviewId(env.id); setMenuOpen(null); } },
                            { icon: <Pencil size={12} />, label: "Edit in Builder", onClick: () => { navigate(`/envelope?id=${env.id}&from=library`); setMenuOpen(null); } },
                            { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(env.id) },
                            { icon: <Palette size={12} />, label: "Duplicate & edit in Builder", onClick: () => { handleCopyToBuilder(env.id); setMenuOpen(null); } },
                            { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(env.id); setMenuOpen(null); }, danger: true },
                          ]}
                        />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {([
                      { label: "Primary", color: env.primaryColor },
                      { label: "Secondary", color: env.secondaryColor },
                      { label: "Tertiary", color: env.tertiaryColor },
                    ] as const).map(c => (
                      <div key={c.label} title={`${c.label}: ${c.color}`}>
                        <ColorDot color={c.color} size={8} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-[#999]">{env.updated}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View / Preview modal (shows ALL properties) ──────────────── */}
      {preview && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setPreviewId(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-[61] pointer-events-none p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider sticky top-0 bg-white z-10">
                <h2 className="text-[16px] font-black text-tv-text-primary">{preview.title}</h2>
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
                          { icon: <Copy size={12} />, label: "Duplicate", onClick: () => { handleDuplicate(preview.id); setModalMenuOpen(false); } },
                          { icon: <Trash2 size={12} />, label: "Delete", onClick: () => { setDeleteConfirm(preview.id); setPreviewId(null); setModalMenuOpen(false); }, danger: true },
                        ]}
                      />
                    )}
                  </div>
                  <button onClick={() => { setPreviewId(null); setModalMenuOpen(false); }} aria-label="Close preview" className="w-7 h-7 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover"><X size={13} /></button>
                </div>
              </div>

              {/* Envelope visual */}
              <div className="p-5 flex justify-center bg-[#f5f0fa]">
                <EnvelopePreview
                  envelopeColor={preview.envelopeColor}
                  linerColor={preview.linerColor}
                  frontDesign={preview.frontDesign}
                  frontDesignColor={preview.frontDesignColor}
                  primaryColor={preview.primaryColor}
                  secondaryColor={preview.secondaryColor}
                  tertiaryColor={preview.tertiaryColor}
                  stampSelection={preview.stampSelection}
                  postmarkColor={preview.postmarkColor}
                  frontLeftLogo={preview.frontLeftLogo}
                  recipientNameColor={preview.recipientNameColor}
                  showName
                  mode="front"
                  width={320}
                />
              </div>

              {/* ── Properties table ──────────────────────────────────── */}
              <div className="px-5 py-4 space-y-5">

                {/* ── Brand Colors ──────────────────────────────────── */}
                <div>
                  <SectionHeader icon={<Palette size={12} />} label="Brand Colors" />
                  <div className="flex items-center gap-3 mt-3 mb-3">
                    {[
                      { label: "Primary", color: preview.primaryColor },
                      { label: "Secondary", color: preview.secondaryColor },
                      { label: "Tertiary", color: preview.tertiaryColor },
                    ].map(c => (
                      <div key={c.label} className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-[6px] shrink-0 border border-black/10 shadow-sm" style={{ backgroundColor: c.color }} />
                        <div className="min-w-0">
                          <p className="text-[11px] text-tv-text-secondary truncate">{c.label}</p>
                          <p className="text-[12px] font-mono text-tv-text-primary truncate">{c.color}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Envelope Colors ───────────────────────────────── */}
                <div>
                  <SectionHeader icon={<Mail size={12} />} label="Envelope Colors" />
                  <div className="mt-2 space-y-0">
                    <PropColor label="Envelope color" color={preview.envelopeColor} />
                    <PropColor label="Envelope liner color" color={preview.linerColor} />
                    <PropColor label="Recipient name color" color={preview.recipientNameColor} />
                  </div>
                </div>

                {/* ── Front Design & Logos ──────────────────────────── */}
                <div>
                  <SectionHeader icon={<ImageIcon size={12} />} label="Design & Logos" />
                  <div className="mt-2 space-y-0">
                    <PropRow label="Front design" value={preview.frontDesign === "none" ? "No design" : preview.frontDesign.charAt(0).toUpperCase() + preview.frontDesign.slice(1)} />
                    {preview.frontDesign !== "none" && <PropColor label="Front design color" color={preview.frontDesignColor} />}
                    <PropRow label="Front left logo" value={LOGO_LABELS[preview.frontLeftLogo]} />
                    <PropRow label="Back flap logo" value={LOGO_LABELS[preview.backFlapLogo]} />
                  </div>
                </div>

                {/* ── Postmark & Stamp ──────────────────────────────── */}
                <div>
                  <SectionHeader icon={<StampIcon size={12} />} label="Postmark & Stamp" />
                  <div className="mt-2 space-y-0">
                    <PropRow label="Postmark copy" value={preview.postmarkCopy} />
                    <PropColor label="Postmark color" color={preview.postmarkColor} />
                    <PropStamp label="Stamp selection" stamp={preview.stampSelection} />
                  </div>
                </div>

                {/* ── Details ───────────────────────────────────────── */}
                <div>
                  <SectionHeader icon={<Tag size={12} />} label="Details" />
                  <div className="mt-2 space-y-0">
                    <PropRow label="Title" value={preview.title} />
                    <PropRow label="Category" value={preview.category} />
                    <PropRow label="Last updated" value={preview.updated} />
                    <PropRow label="Times used" value={String(preview.used)} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 flex gap-2 border-t border-tv-border-divider">
                <button onClick={() => { setPreviewId(null); navigate(`/envelope?id=${preview.id}&from=library`); }} className="flex-1 py-2.5 border border-tv-brand-bg text-tv-text-brand rounded-full text-[12px] font-semibold hover:bg-tv-brand-tint transition-colors flex items-center justify-center gap-2">
                  <Pencil size={11} />Edit
                </button>
                <button onClick={() => { setPreviewId(null); handleCopyToBuilder(preview.id); }} className="flex-1 py-2.5 border border-tv-border-light text-tv-text-secondary rounded-full text-[12px] font-medium hover:bg-tv-surface transition-colors flex items-center justify-center gap-2">
                  <Copy size={11} />Duplicate &amp; Edit
                </button>
                <button onClick={() => { setPreviewId(null); navigate("/campaigns/create"); }} className="flex-1 py-2.5 bg-tv-brand-bg text-white rounded-full text-[12px] font-semibold hover:bg-tv-brand transition-colors flex items-center justify-center gap-2">
                  <Send size={11} />Use
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirm !== null && (
        <DeleteModal
          title="Delete this envelope?"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ── Property display helpers ──────────────────────────────────────────────
function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-2 flex items-center justify-between py-1.5 border-b border-tv-surface">
      <span className="text-[12px] text-tv-text-secondary">{label}</span>
      <span className="text-[12px] text-tv-text-primary font-medium text-right">{value}</span>
    </div>
  );
}

function PropColor({ label, color }: { label: string; color: string }) {
  const isWhite = color.toLowerCase() === "#ffffff";
  return (
    <div className="col-span-2 flex items-center justify-between py-1.5 border-b border-tv-surface">
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

function PropStamp({ label, stamp }: { label: string; stamp: string }) {
  return (
    <div className="col-span-2 flex items-center justify-between py-1.5 border-b border-tv-surface">
      <span className="text-[12px] text-tv-text-secondary">{label}</span>
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-tv-text-primary">{STAMP_ICONS[stamp]} {STAMP_LABELS[stamp]}</span>
    </div>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-tv-border-light">
      <div className="w-5 h-5 rounded-[5px] bg-tv-brand-tint flex items-center justify-center text-tv-text-brand shrink-0">{icon}</div>
      <p className="text-[11px] font-semibold text-tv-text-label uppercase tracking-wider">{label}</p>
    </div>
  );
}