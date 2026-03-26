import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Mail, Image as ImageIcon, Film, Globe,
  Sparkles, Copy, Eye, MoreHorizontal, MessageSquare,
  ArrowRight, Star, Clock, Layers, Grid3X3,
  Clapperboard, MonitorPlay, FileText,
  X, Trash2,
  Wand2, ArrowUpDown,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { ViewToggle } from "../components/ViewToggle";
import { AssetActionMenu } from "../components/ui/AssetActionMenu";
import {
  Box, Stack, Text, UnstyledButton,
  TextInput, SimpleGrid,
  Modal, Menu, ActionIcon, Tooltip,
} from "@mantine/core";
import { TV } from "../theme";
import { Breadcrumbs } from "../components/Breadcrumbs";

// ── Types ─────
type AssetType = "all" | "videos" | "envelopes" | "landing-pages" | "images" | "templates" | "intros" | "outros";

interface Asset {
  id: number;
  name: string;
  type: AssetType;
  typeLabel: string;
  thumbnail?: string;
  updated: string;
  usedIn: number;
  starred: boolean;
  status: "Active" | "Draft" | "Archived";
  description: string;
  priority?: "High" | "Med";
  tags: string[];
}

// ── Asset Categories ──────────────────────────────────────────────────────
const ASSET_CATEGORIES = [
  {
    key: "videos" as AssetType,
    label: "Library Videos",
    description: "Video recordings, clips, and personalized video messages",
    icon: Film,
    color: "text-tv-info",
    bg: "bg-tv-info-bg",
    borderColor: "border-tv-record-border",
    count: 31,
    recentCount: 4,
    route: "/videos",
    capabilities: ["View", "Edit", "Duplicate"],
    details: "Titles, descriptions, tags, captions, trimming, rotation, cropping, thumbnails, folders",
  },
  {
    key: "envelopes" as AssetType,
    label: "Envelopes",
    description: "Custom envelope designs with branding, colors, and postmarks",
    icon: Mail,
    color: "text-tv-info",
    bg: "bg-tv-info-bg",
    borderColor: "border-tv-info-border",
    count: 8,
    recentCount: 2,
    route: "/assets/envelopes",
    capabilities: ["View", "Edit", "Duplicate"],
    details: "Brand colors, liner, recipient name color, front design, logos, postmark, stamp",
  },
  {
    key: "landing-pages" as AssetType,
    label: "Landing Pages",
    description: "Recipient-facing landing pages with nav, backgrounds, and CTAs",
    icon: Globe,
    color: "text-tv-success",
    bg: "bg-tv-success-bg",
    borderColor: "border-tv-success-border",
    count: 12,
    recentCount: 3,
    route: "/assets/landing-pages",
    capabilities: ["View", "Edit", "Duplicate"],
    details: "Nav bar color/logo, background image, gradient, button & text colors for CTA, reply, save, share",
  },
  {
    key: "images" as AssetType,
    label: "Images",
    description: "Uploaded images for backgrounds, headers, and campaign content",
    icon: ImageIcon,
    color: "text-tv-warning",
    bg: "bg-tv-warning-bg",
    borderColor: "border-tv-warning-border",
    count: 8,
    recentCount: 3,
    route: "/assets/images",
    capabilities: ["View", "Edit Title", "Duplicate"],
    details: "Image title, image preview, used across campaigns and templates",
  },
  {
    key: "intros" as AssetType,
    label: "Intros & Intro Templates",
    description: "Themed slideshows with photos, text, color palettes, and music",
    icon: Clapperboard,
    color: "text-tv-brand",
    bg: "bg-tv-brand-tint",
    borderColor: "border-tv-border",
    count: 14,
    recentCount: 2,
    route: "/assets/intros",
    capabilities: ["View", "Edit", "Duplicate"],
    details: "9 carried-over themes: Logo, Full Frame, Tryptic, Light Leak, Cubed, Clean, Linen, Emboss, Balloons",
  },
  {
    key: "outros" as AssetType,
    label: "Outros & Outro Templates",
    description: "Static end-screens with background color, CTA buttons, and outro music",
    icon: MonitorPlay,
    color: "text-tv-info",
    bg: "bg-tv-info-bg",
    borderColor: "border-tv-info-border",
    count: 8,
    recentCount: 1,
    route: "/assets/outros",
    capabilities: ["View", "Edit", "Duplicate"],
    details: "Background color, CTA link/button, outro music, optional logo/image",
  },
];

// ── Mock Recent Assets ────────────────────────────────────────────────────────
const RECENT_ASSETS: Asset[] = [
  { id: 1, name: "Spring Appeal Envelope",         type: "envelopes",     typeLabel: "Envelope",     updated: "2 hrs ago",   usedIn: 3,  starred: true,  status: "Active",   description: "Navy blue with gold postmark, Hartwell logo",       priority: "High", tags: ["Spring 2026", "Appeal"] },
  { id: 2, name: "Welcome Intro - Logo",            type: "intros",        typeLabel: "Intro",        updated: "4 hrs ago",   usedIn: 12, starred: true,  status: "Active",   description: "Logo theme with campus background",                 priority: "High", tags: ["Welcome", "Onboarding"] },
  { id: 3, name: "Thank You Landing Page",         type: "landing-pages", typeLabel: "Landing Page", updated: "Yesterday",   usedIn: 8,  starred: false, status: "Active",   description: "Purple nav, campus library background with gradient", priority: "High", tags: ["Thank You"] },

  { id: 5, name: "Scholarship Recipient Photo",    type: "images",        typeLabel: "Image",        updated: "2 days ago",  usedIn: 4,  starred: false, status: "Active",   description: "1600x1200 portrait, used in scholarship campaigns", priority: "Med",  tags: ["Scholarship", "Photo"] },
  { id: 6, name: "Campaign Outro - Shield",        type: "outros",        typeLabel: "Outro",        updated: "3 days ago",  usedIn: 18, starred: true,  status: "Active",   description: "Hartwell shield with call-to-action overlay",       priority: "High", tags: ["Branding"] },
  { id: 7, name: "Donor Thank You Video",          type: "videos",        typeLabel: "Video",        updated: "3 days ago",  usedIn: 1,  starred: false, status: "Active",   description: "1:08 personal thank you, trimmed",                  priority: "Med",  tags: ["Thank You", "Major Donors"] },
  { id: 8, name: "Gala 2026 Invitation Envelope",  type: "envelopes",     typeLabel: "Envelope",     updated: "4 days ago",  usedIn: 0,  starred: false, status: "Draft",    description: "Burgundy with cream liner, formal postmark",        priority: "Med",  tags: ["Gala", "Events"] },

  { id: 10, name: "Light Leak Intro - Spring",     type: "intros",        typeLabel: "Intro",        updated: "1 week ago",  usedIn: 6,  starred: false, status: "Active",   description: "Light Leak theme with spring campus photos",        priority: "Med",  tags: ["Spring 2026"] },
  { id: 11, name: "Spring Campaign Landing Page",  type: "landing-pages", typeLabel: "Landing Page", updated: "1 week ago",  usedIn: 1,  starred: false, status: "Draft",    description: "Green CTA, white nav, garden background",          priority: "Med",  tags: ["Spring 2026"] },
  { id: 12, name: "hartwell_logo_navy.png",        type: "images",        typeLabel: "Image",        updated: "2 weeks ago", usedIn: 48, starred: true,  status: "Active",   description: "800x240 logo, primary brand asset",                priority: "High", tags: ["Logo", "Branding"] },
];

// ── Type Colors ───────────────────────────────────────────────────────────────
function typeColor(type: AssetType): string {
  switch (type) {
    case "videos":        return "bg-tv-info-bg text-tv-info";
    case "envelopes":     return "bg-tv-info-bg text-tv-info";
    case "landing-pages": return "bg-tv-success-bg text-tv-success";
    case "images":        return "bg-tv-warning-bg text-tv-warning";
    case "templates":     return "bg-tv-danger-bg text-tv-danger";
    case "intros":        return "bg-tv-brand-tint text-tv-brand";
    case "outros":        return "bg-tv-info-bg text-tv-info";
    default:              return "bg-tv-surface text-tv-text-secondary";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "Active":   return "bg-tv-success-bg text-tv-success";
    case "Draft":    return "bg-tv-brand-tint text-tv-brand";
    case "Archived": return "bg-tv-surface-muted text-tv-text-secondary";
    default:         return "bg-tv-surface-muted text-tv-text-secondary";
  }
}

// ── Wizard Data ───────────────────────────────────────────────────────────────
type WizardAssetType = Exclude<AssetType, "all">;

interface WizardCategory {
  key: WizardAssetType;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  colorHex: string;
  bgHex: string;
  hasBuilder: boolean;
  builderRoute: string | null;
  startOptions: { key: string; label: string; description: string }[];
}

const WIZARD_CATEGORIES: WizardCategory[] = [
  {
    key: "templates" as WizardAssetType, label: "Email Template", shortLabel: "Email",
    description: "Email content — subject, body copy, merge tags, video, and CTA",
    icon: FileText, colorHex: TV.brand, bgHex: TV.brandTint,
    hasBuilder: true, builderRoute: "/template/create?channel=email",
    startOptions: [
      { key: "blank", label: "Start from scratch", description: "Write email content with default fields" },
      { key: "preset", label: "Use a preset", description: "Choose from pre-written content presets" },
    ],
  },
  {
    key: "templates" as WizardAssetType, label: "SMS Template", shortLabel: "SMS",
    description: "Short text message with merge tags for personalization",
    icon: MessageSquare, colorHex: TV.info, bgHex: TV.infoBg,
    hasBuilder: true, builderRoute: "/template/create?channel=sms",
    startOptions: [
      { key: "blank", label: "Start from scratch", description: "Compose a new SMS message from scratch" },
      { key: "preset", label: "Use a preset", description: "Choose from pre-written SMS content" },
    ],
  },
  {
    key: "videos", label: "Library Video", shortLabel: "Video",
    description: "Upload or record a video for your library",
    icon: Film, colorHex: TV.record, bgHex: TV.recordTint,
    hasBuilder: false, builderRoute: "/video/create",
    startOptions: [
      { key: "record", label: "Record new video", description: "Open the video recorder to capture a new clip" },
      { key: "upload", label: "Upload video file", description: "Upload an MP4, MOV, or WebM from your computer" },
    ],
  },
  {
    key: "images", label: "Image", shortLabel: "Image",
    description: "Upload an image for backgrounds, headers, or campaign content",
    icon: ImageIcon, colorHex: TV.warning, bgHex: TV.warningBg,
    hasBuilder: false, builderRoute: null,
    startOptions: [
      { key: "upload", label: "Upload image", description: "Upload a PNG, JPG, or SVG from your computer" },
      { key: "url", label: "Import from URL", description: "Paste a public image URL to import" },
    ],
  },
  {
    key: "intros", label: "Intro", shortLabel: "Intro",
    description: "Themed slideshow with photos, text, color palette, and music",
    icon: Clapperboard, colorHex: TV.brand, bgHex: TV.brandTint,
    hasBuilder: false, builderRoute: "/intro/create",
    startOptions: [
      { key: "theme", label: "Choose a theme", description: "Pick from 9 carried-over intro themes (Logo, Full Frame, etc.)" },
      { key: "duplicate", label: "Duplicate existing", description: "Duplicate and modify an existing intro" },
    ],
  },
  {
    key: "outros", label: "Outro", shortLabel: "Outro",
    description: "Static end-screen with background color, CTA button, and music",
    icon: MonitorPlay, colorHex: TV.info, bgHex: TV.infoBg,
    hasBuilder: true, builderRoute: "/outro/create",
    startOptions: [
      { key: "blank", label: "Start from scratch", description: "Create a new outro with a title and attached image" },
      { key: "duplicate", label: "Duplicate existing", description: "Duplicate and modify an existing outro" },
    ],
  },
  {
    key: "envelopes", label: "Envelope Design", shortLabel: "Envelope",
    description: "Custom envelope with branding, colors, textures, and postmarks",
    icon: Mail, colorHex: TV.info, bgHex: TV.infoBg,
    hasBuilder: true, builderRoute: "/envelope",
    startOptions: [
      { key: "blank", label: "Start from scratch", description: "Open the Envelope Builder with a blank canvas" },
      { key: "duplicate", label: "Duplicate existing", description: "Choose an existing envelope to duplicate and modify" },
      { key: "brand", label: "Auto-generate from brand", description: "Pre-fill with your org's brand colors and logo" },
    ],
  },
  {
    key: "landing-pages", label: "Landing Page", shortLabel: "Landing Page",
    description: "Recipient-facing page with video, CTA, and reply form",
    icon: Globe, colorHex: TV.success, bgHex: TV.successBg,
    hasBuilder: true, builderRoute: "/landing?returnTo=/assets",
    startOptions: [
      { key: "blank", label: "Start from scratch", description: "Open the Landing Page Builder with default blocks" },
      { key: "duplicate", label: "Duplicate existing", description: "Choose an existing landing page to duplicate and modify" },
      { key: "minimal", label: "Minimal template", description: "Video + CTA only, no story or reply form" },
    ],
  },
];



// ── Asset Creation Wizard (Train Station) ─────────────────────────────────────
// Single-step modal that routes users to the correct full-page builder for each
// asset type. Think of it as a train station, not a workspace.

const ASSET_DESTINATIONS: Partial<Record<WizardAssetType, { route: string; toast: string }>> = {
  envelopes:       { route: "/envelope",        toast: "Opening the Envelope Builder" },
  "landing-pages": { route: "/landing?returnTo=/assets", toast: "Opening the Landing Page Builder" },

  videos:          { route: "/video/create",    toast: "Opening the Video Recorder" },
  images:          { route: "/assets/images",   toast: "Opening the Image Library" },
  intros:          { route: "/intro/create",    toast: "Opening the Intro Builder" },
  outros:          { route: "/outro/create",    toast: "Opening the Outro Builder" },
};

function AssetCreationWizard({ opened, onClose }: {
  opened: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchFilter, setSearchFilter] = useState("");

  const handleClose = () => { setSearchFilter(""); onClose(); };

  const filteredCategories = searchFilter
    ? WIZARD_CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.shortLabel.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : WIZARD_CATEGORIES;

  const handleSelectType = (cat: WizardCategory) => {
    handleClose();
    if (cat.builderRoute) {
      const dest = ASSET_DESTINATIONS[cat.key];
      show(dest?.toast || `Opening the ${cat.label} Builder`, "info");
      navigate(cat.builderRoute);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <Box w={28} h={28} style={{ borderRadius: 8, backgroundColor: TV.brandTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wand2 size={14} style={{ color: TV.textBrand }} />
          </Box>
          <div>
            <Text fz={16} fw={900} c={TV.textPrimary}>Create New Asset</Text>
            <Text fz={11} c={TV.textSecondary}>Choose an asset type — you'll be taken to its full builder</Text>
          </div>
        </div>
      }
      size="lg"
      styles={{
        title: { flex: 1 },
        body: { padding: 0 },
      }}
    >
      <Box p="lg">
        <TextInput
          value={searchFilter}
          onChange={e => setSearchFilter(e.currentTarget.value)}
          placeholder="Filter asset types..."
          leftSection={<Search size={13} />}
          radius="xl"
          mb="md"
          styles={{ input: { backgroundColor: TV.surface, borderColor: TV.borderLight } }}
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {filteredCategories.map((cat, catIdx) => {
            const dest = ASSET_DESTINATIONS[cat.key];
            return (
              <UnstyledButton
                key={`${cat.key}-${cat.label}`}
                onClick={() => {
                  handleClose();
                  const dest = ASSET_DESTINATIONS[cat.key];
                  const route = cat.builderRoute || dest?.route;
                  if (route) {
                    show(dest?.toast || `Opening the ${cat.label} Builder`, "info");
                    navigate(route);
                  }
                }}
                p="md"
                style={{
                  borderRadius: 12,
                  border: `1.5px solid ${TV.borderLight}`,
                  transition: "all 0.15s",
                }}
                className="hover:shadow-md"
                styles={{
                  root: {
                    "&:hover": {
                      borderColor: cat.colorHex,
                      backgroundColor: cat.bgHex,
                    },
                  },
                }}
              >
                <div className="flex items-start gap-3">
                  <Box
                    w={40} h={40}
                    style={{
                      borderRadius: 10,
                      backgroundColor: cat.bgHex,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <cat.icon size={18} style={{ color: cat.colorHex }} />
                  </Box>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fz={13} fw={700} c={TV.textPrimary} mb={2}>{cat.label}</Text>
                    <Text fz={11} c={TV.textSecondary} lh="16px">{cat.description}</Text>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowRight size={10} style={{ color: cat.colorHex }} />
                      <Text fz={10} c={cat.colorHex} fw={600}>
                        {dest?.toast.replace("Opening the ", "").replace("Opening ", "") || `${cat.label} Builder`}
                      </Text>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: TV.borderStrong, flexShrink: 0, marginTop: 2 }} />
                </div>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
        {filteredCategories.length === 0 && (
          <Stack align="center" py="xl" gap="xs">
            <Search size={20} style={{ color: TV.borderStrong }} />
            <Text fz={13} c={TV.textSecondary}>No asset types match your filter.</Text>
          </Stack>
        )}
      </Box>
    </Modal>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CreateAssets() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<AssetType>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "used">("recent");
  const [assets, setAssets] = useState(RECENT_ASSETS);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [highlightedAssetId, setHighlightedAssetId] = useState<number | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear highlight after 5s
  useEffect(() => {
    if (highlightedAssetId !== null) {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightedAssetId(null), 5000);
    }
    return () => { if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current); };
  }, [highlightedAssetId]);

  // Scroll highlighted asset into view after render
  useEffect(() => {
    if (highlightedAssetId !== null) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-asset-id="${highlightedAssetId}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [highlightedAssetId]);

  const filtered = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && a.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "used") return b.usedIn - a.usedIn;
    return 0; // recent = default order
  });

  const totalAssets = ASSET_CATEGORIES.reduce((sum, c) => sum + c.count, 0);

  const handleNavigateCategory = (cat: typeof ASSET_CATEGORIES[0]) => {
    if (cat.route) {
      navigate(cat.route);
    } else {
      show(`${cat.label} page coming soon`, "info");
    }
  };

  const handleOpenAsset = (asset: Asset) => {
    const cat = ASSET_CATEGORIES.find(c => c.key === asset.type);
    if (cat?.route) {
      navigate(`${cat.route}?highlight=${encodeURIComponent(asset.name)}`);
    } else {
      show(`${asset.typeLabel} detail page coming soon`, "info");
    }
  };

  const handleDuplicate = (id: number) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    const copy = { ...asset, id: Date.now(), name: `${asset.name} (Duplicate)`, usedIn: 0, starred: false, status: "Draft" as const, updated: "Just now" };
    setAssets(prev => [copy, ...prev]);
    show(`"${asset.name}" duplicated`, "success");
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const asset = assets.find(a => a.id === id);
    setAssets(prev => prev.filter(a => a.id !== id));
    show(`"${asset?.name}" deleted`, "success");
    setMenuOpen(null);
  };

  const toggleStar = (id: number) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, starred: !a.starred } : a));
  };

  return (
    <div className="p-4 md:p-8 pt-0 min-h-full">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 md:pt-6 pb-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-2">
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "All Assets" },
        ]} />
      </div>

      {/* Hero Header */}
      <div className="relative bg-tv-brand rounded-xl overflow-hidden mb-6 px-5 sm:px-8 py-6 sm:py-8">
        <div className="absolute right-16 top-[-32px] w-48 h-48 bg-white rounded-full opacity-10 pointer-events-none" />
        <div className="absolute right-24 top-8 w-32 h-32 bg-white rounded-full opacity-5 pointer-events-none" />
        <div className="absolute right-48 top-4 w-20 h-20 bg-white rounded-full opacity-[0.07] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] sm:text-[24px] font-black text-white leading-tight font-display">All Assets</h1>
            <p className="text-[13px] text-white/80 mt-1">
              Manage your library of videos, envelopes, landing pages, intros, outros, and images.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Layers size={12} className="text-white/70" />
                <span className="text-[11px] text-white font-medium">{totalAssets} total assets</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Sparkles size={12} className="text-yellow-300" />
                <span className="text-[11px] text-white font-medium">9 intro themes available</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 bg-white text-tv-brand px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-white/90 transition-colors shrink-0 shadow-lg"
          >
            <Plus size={15} />Create New Asset
          </button>
        </div>
      </div>

      {/* All Assets Section with Filters */}
      <div className="bg-white rounded-xl border border-tv-border-strong overflow-hidden">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-tv-border-divider">
          <div>
            <h2 className="text-[16px] font-black text-tv-text-primary">All Assets</h2>
            <p className="text-[12px] text-tv-text-secondary mt-0.5">{filtered.length} asset{filtered.length !== 1 ? "s" : ""} {filterType !== "all" ? `in ${ASSET_CATEGORIES.find(c => c.key === filterType)?.label || filterType}` : ""}</p>
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <ViewToggle
              value={view}
              onChange={(v) => setView(v as "grid" | "list")}
              options={[
                { value: "grid", icon: <Grid3X3 size={12} />, label: "Grid View" },
                { value: "list", icon: <Layers size={12} />, label: "List View" },
              ]}
            />
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-3 border-b border-tv-border-divider bg-tv-surface-muted overflow-x-auto">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-tv-border-light min-w-[200px] w-[255px] shrink-0">
            <Search size={13} className="text-tv-text-secondary shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search all assets..."
              aria-label="Search all assets"
              className="bg-transparent text-[13px] text-tv-text-primary outline-none w-full placeholder:text-tv-text-decorative focus-visible:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-tv-text-secondary hover:text-tv-text-label"><X size={12} /></button>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: "all" as AssetType, label: "All" },
              ...ASSET_CATEGORIES.map(c => ({ key: c.key, label: c.label.split(" ")[0] })),
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key)}
                className={`px-4 py-1.5 rounded-full text-[13px] transition-all whitespace-nowrap ${
                  filterType === tab.key
                    ? "bg-tv-brand text-white"
                    : "border border-tv-border text-tv-text-secondary hover:border-tv-border-strong"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div
            className="shrink-0 ml-auto bg-tv-surface-active rounded-full p-[3.5px]"
            style={{ border: `1.5px solid ${TV.borderStrong}` }}
          >
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Sort" withArrow position="bottom" openDelay={300}>
                  <ActionIcon variant="subtle" size={32} radius="xl" aria-label="Sort assets" style={{ color: TV.brand, backgroundColor: TV.surface }}>
                    <ArrowUpDown size={14} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Sort by</Menu.Label>
                {([
                  { key: "recent" as const, label: "Most Recent" },
                  { key: "name" as const, label: "Name A-Z" },
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
          </div>
        </div>

        {/* Asset List / Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
              <Search size={22} className="text-tv-text-decorative" />
            </div>
            <p className="text-[14px] font-semibold text-tv-text-primary mb-1">No assets found</p>
            <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or filters.</p>
          </div>
        ) : view === "list" ? (
          /* List View */
          <div className="divide-y divide-tv-border-divider">
            {filtered.map(asset => (
              <div
                key={asset.id}
                data-asset-id={asset.id}
                onClick={() => handleOpenAsset(asset)}
                className={`flex items-center gap-4 px-5 py-3 hover:bg-tv-surface-muted transition-all group cursor-pointer ${
                  highlightedAssetId === asset.id
                    ? "bg-tv-brand-tint ring-2 ring-tv-brand-bg ring-inset animate-[pulse_1.5s_ease-in-out_2]"
                    : ""
                }`}
              >
                {/* Type icon */}
                <div className={`w-9 h-9 rounded-md ${typeColor(asset.type).split(" ")[0]} flex items-center justify-center shrink-0`}>
                  {(() => {
                    const cat = ASSET_CATEGORIES.find(c => c.key === asset.type);
                    const Icon = cat?.icon || Layers;
                    return <Icon size={16} className={typeColor(asset.type).split(" ")[1]} />;
                  })()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-tv-text-primary truncate">{asset.name}</p>
                    {highlightedAssetId === asset.id && (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-tv-brand-bg text-white">NEW</span>
                    )}
                    {asset.starred && <Star size={10} className="text-tv-star fill-tv-star shrink-0" />}
                  </div>
                  <p className="text-[11px] text-tv-text-secondary truncate">{asset.description}</p>
                </div>
                {/* Meta */}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${typeColor(asset.type)}`}>{asset.typeLabel}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusColor(asset.status)}`}>{asset.status}</span>
                <span className="text-[11px] text-tv-text-secondary shrink-0 w-[80px] text-right">{asset.updated}</span>
                <span className="text-[11px] text-tv-text-secondary shrink-0 w-[60px] text-right">{asset.usedIn} uses</span>
                {/* Actions */}
                <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setMenuOpen(menuOpen === asset.id ? null : asset.id)} aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen === asset.id} className="p-1 rounded hover:bg-tv-surface transition-colors">
                    <MoreHorizontal size={14} className="text-tv-text-secondary" />
                  </button>
                  {menuOpen === asset.id && (
                    <AssetActionMenu
                      width={160}
                      onClose={() => setMenuOpen(null)}
                      actions={[
                        { icon: <Eye size={12} />, label: "View", onClick: () => { handleOpenAsset(asset); setMenuOpen(null); } },
                        { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(asset.id) },
                        { icon: <Star size={12} />, label: asset.starred ? "Unstar" : "Star", onClick: () => toggleStar(asset.id) },
                        { icon: <Trash2 size={12} />, label: "Delete", onClick: () => handleDelete(asset.id), danger: true },
                      ]}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
            {filtered.map(asset => (
              <div
                key={asset.id}
                data-asset-id={asset.id}
                onClick={() => handleOpenAsset(asset)}
                className={`bg-white rounded-lg border overflow-hidden hover:shadow-md transition-all group relative cursor-pointer ${
                  highlightedAssetId === asset.id
                    ? "border-tv-brand-bg ring-2 ring-tv-brand-bg shadow-lg shadow-tv-brand-bg/20 animate-[pulse_1.5s_ease-in-out_2]"
                    : "border-tv-border-light hover:border-tv-border-strong"
                }`}
              >
                {/* Header bar with type color */}
                <div className={`h-2 ${typeColor(asset.type).split(" ")[0]}`} />
                <div className="p-3.5">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-8 h-8 rounded-sm ${typeColor(asset.type).split(" ")[0]} flex items-center justify-center shrink-0`}>
                      {(() => {
                        const cat = ASSET_CATEGORIES.find(c => c.key === asset.type);
                        const Icon = cat?.icon || Layers;
                        return <Icon size={14} className={typeColor(asset.type).split(" ")[1]} />;
                      })()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusColor(asset.status)}`}>{asset.status}</span>
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setMenuOpen(menuOpen === asset.id ? null : asset.id)} aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen === asset.id} className="p-1.5 min-w-[24px] min-h-[24px] flex items-center justify-center rounded hover:bg-tv-surface transition-colors">
                          <MoreHorizontal size={12} className="text-tv-text-secondary" />
                        </button>
                        {menuOpen === asset.id && (
                          <AssetActionMenu
                            width={160}
                            onClose={() => setMenuOpen(null)}
                            actions={[
                              { icon: <Eye size={12} />, label: "View", onClick: () => { handleOpenAsset(asset); setMenuOpen(null); } },
                              { icon: <Copy size={12} />, label: "Duplicate", onClick: () => handleDuplicate(asset.id) },
                              { icon: <Star size={12} />, label: asset.starred ? "Unstar" : "Star", onClick: () => toggleStar(asset.id) },
                              { icon: <Trash2 size={12} />, label: "Delete", onClick: () => handleDelete(asset.id), danger: true },
                            ]}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-[13px] font-semibold text-tv-text-primary truncate">{asset.name}</p>
                    {highlightedAssetId === asset.id && (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-tv-brand-bg text-white">NEW</span>
                    )}
                  </div>
                  <p className="text-[11px] text-tv-text-secondary line-clamp-2 leading-snug mb-2.5">{asset.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {asset.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center whitespace-nowrap text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-tv-surface text-tv-text-secondary border border-tv-border-divider">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-tv-border-divider">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary"><Clock size={9} />{asset.updated}</span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-tv-text-secondary"><Layers size={9} />{asset.usedIn} uses</span>
                    </div>
                    {asset.starred && <Star size={10} className="text-tv-star fill-tv-star" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Categories */}
      <div className="mt-6">
        <h2 className="text-[16px] font-black text-tv-text-primary mb-3">Asset Categories</h2>
        <div className="flex flex-wrap gap-2">
          {ASSET_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => handleNavigateCategory(cat)}
              className={`bg-white rounded-lg border ${cat.borderColor} px-3 py-2 flex items-center gap-2.5 text-left hover:shadow-md hover:border-tv-border-strong transition-all group`}
            >
              <div className={`w-7 h-7 rounded-sm ${cat.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <cat.icon size={14} className={cat.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-tv-text-primary whitespace-nowrap">{cat.label}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-1">
                <span className="text-[13px] font-black text-tv-text-primary">{cat.count}</span>
                <ArrowRight size={11} className="text-tv-text-decorative group-hover:text-tv-brand group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Migration Notice */}
      <div className="mt-6 bg-tv-warning-bg rounded-xl border border-tv-warning-border p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-tv-warning-border flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-tv-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-tv-text-primary mb-1">Historic ThankView Assets Migration</p>
            <p className="text-[12px] text-tv-text-secondary leading-relaxed">
              Assets migrated from ThankView include library videos, saved landing pages, envelopes, images, outros & outro templates, and intros.
              All migrated campaigns receive visibility settings of "visible & editable by all users" and are tagged by their original project type.
              Video overlays have been removed from the UI. Non-carried-over intro themes are view-only for existing campaigns.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[10px] font-medium text-tv-warning bg-tv-warning-border px-2 py-1 rounded-full">6 asset types supported</span>
              <span className="text-[10px] font-medium text-tv-warning bg-tv-warning-border px-2 py-1 rounded-full">9 intro themes carried over</span>
              <span className="text-[10px] font-medium text-tv-warning bg-tv-warning-border px-2 py-1 rounded-full">Overlays deprecated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Creation Wizard (train station — routes to full builders) */}
      <AssetCreationWizard
        opened={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}