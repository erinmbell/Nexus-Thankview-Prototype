import { useState } from "react";
import {
  Clapperboard, MonitorPlay, ChevronDown,
  Play, Pause, Music, VolumeX,
  Upload, Trash2, Library, Link2,
} from "lucide-react";
import { Text } from "@mantine/core";
import { TV } from "../../theme";
import { useToast } from "../../contexts/ToastContext";
import { ImageUploadModal } from "../../components/ui/ImageUploadModal";
import { ColorPickerPopover } from "../../components/ui/ColorPickerPopover";

// ═════════════════════════════════════════════════════════════════════════════
//  IntroBuilder  — Figma prototype layout
// ═════════════════════════════════════════════════════════════════════════════

// ── Intro-specific theme data ────────────────────────────────────────────────
interface IntroTheme {
  id: number;
  name: string;
  category: "image" | "message";
  gradient: string;
  thumbnail: string;
}

const INTRO_IMAGE_THEMES: IntroTheme[] = [
  { id: 1, name: "Logo",       category: "image",   gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)", thumbnail: "" },
  { id: 2, name: "Full Frame", category: "image",   gradient: "linear-gradient(143.13deg, #166534 0%, #15803d 100%)", thumbnail: "" },
  { id: 3, name: "Tryptic",    category: "image",   gradient: "linear-gradient(143.13deg, #374151 0%, #6b7280 100%)", thumbnail: "" },
  { id: 4, name: "Light Leak", category: "image",   gradient: "linear-gradient(143.13deg, #b91c1c 0%, #dc2626 100%)", thumbnail: "" },
  { id: 5, name: "Cubed",      category: "image",   gradient: "linear-gradient(143.13deg, #007c9e 0%, #00c0f5 100%)", thumbnail: "" },
  { id: 6, name: "Clean",      category: "image",   gradient: "linear-gradient(143.13deg, #b45309 0%, #b45309 100%)", thumbnail: "" },
  { id: 7, name: "Linen",      category: "message", gradient: "linear-gradient(143.13deg, #4c1d95 0%, #7c3aed 100%)", thumbnail: "" },
  { id: 8, name: "Emboss",     category: "message", gradient: "linear-gradient(143.13deg, #1e3a8a 0%, #3b82f6 100%)", thumbnail: "" },
  { id: 9, name: "Balloons",   category: "message", gradient: "linear-gradient(143.13deg, #0f766e 0%, #2dd4bf 100%)", thumbnail: "" },
];

const INTRO_YOUR_SAVED = INTRO_IMAGE_THEMES.slice(0, 6);

const INTRO_FONT_OPTIONS = [
  { value: "roboto", label: "Roboto", family: "'Roboto', sans-serif" },
  { value: "fraunces", label: "Fraunces", family: "'Fraunces', Roboto, sans-serif" },
  { value: "playfair", label: "Playfair Display", family: "'Playfair Display', Roboto, sans-serif" },
  { value: "inter", label: "Inter", family: "'Inter', Roboto, sans-serif" },
  { value: "montserrat", label: "Montserrat", family: "'Montserrat', Roboto, sans-serif" },
  { value: "lora", label: "Lora", family: "'Lora', Roboto, sans-serif" },
  { value: "merriweather", label: "Merriweather", family: "'Merriweather', Roboto, sans-serif" },
];

const INTRO_COLOR_PALETTE = [
  "#7c45b0", "#3b82f6", "#1B3461", "#16A34A", "#059669", "#C8962A", "#dc2626",
];

const INTRO_MOOD_OPTIONS = [
  { value: "uplifting", label: "Uplifting" },
  { value: "calm", label: "Calm" },
  { value: "corporate", label: "Corporate" },
  { value: "festive", label: "Festive" },
];

const INTRO_MUSIC_TRACKS = [
  { value: "bright-horizons", label: "Bright Horizons", mood: "uplifting", duration: "0:38" },
  { value: "morning-light", label: "Morning Light", mood: "uplifting", duration: "0:45" },
  { value: "sparse-walk", label: "Sparse Walk", mood: "calm", duration: "1:22" },
  { value: "still-waters", label: "Still Waters", mood: "calm", duration: "0:52" },
  { value: "forward-motion", label: "Forward Motion", mood: "corporate", duration: "0:41" },
  { value: "steady-climb", label: "Steady Climb", mood: "corporate", duration: "0:36" },
  { value: "bright-bells", label: "Bright Bells", mood: "festive", duration: "0:34" },
  { value: "celebration", label: "Celebration", mood: "festive", duration: "0:48" },
];

const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;800&family=Inter:wght@400;600;800&family=Lora:wght@400;700&family=Merriweather:wght@400;700;900&family=Montserrat:wght@400;600;800&family=Playfair+Display:wght@400;700;800&family=Roboto:wght@400;500;700&display=swap";

// ── Sidebar Theme Section (shared by Intro & Outro) ─────────────────────────
function BuilderThemeSection({
  title,
  count,
  isNew = false,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  isNew?: boolean;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
      <button
        onClick={onToggle}
        className="w-full h-[33px] px-3 flex items-center gap-2 hover:bg-tv-surface-muted transition-colors"
      >
        <ChevronDown
          size={10}
          style={{
            color: TV.textSecondary,
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
        />
        <Text fz={11} fw={600} c={TV.textPrimary} className="flex-1 text-left leading-none">
          {title}
        </Text>
        {isNew && (
          <div className="bg-tv-success-bg border border-tv-success-border rounded px-1.5 py-0.5">
            <Text fz={8} fw={600} c="#15803d" tt="uppercase" lts="0.5" className="leading-none">
              NEW
            </Text>
          </div>
        )}
        {count !== undefined && (
          <Text fz={9} c={TV.textDecorative} className="leading-none">
            ({count})
          </Text>
        )}
      </button>
      {expanded && children && <div className="px-3 py-3">{children}</div>}
    </div>
  );
}

// ── Theme Tile (shared) ─────────────────────────────────────────────────────
function BuilderThemeTile({
  name,
  gradient,
  selected,
  onSelect,
}: {
  id: number;
  name: string;
  gradient: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full h-[56px] rounded-sm overflow-hidden relative group"
      style={{
        background: gradient,
        boxShadow: selected
          ? `0px 0px 0px 1px white, 0px 0px 0px 3px ${TV.brandBg}`
          : "none",
      }}
    >
      {selected && (
        <div
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: TV.brandBg }}
        >
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path d="M1.5 3.5L3 5L5.5 2" stroke="white" strokeWidth="0.583333" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Text fz={8} fw={600} c="rgba(255,255,255,0.7)">
          {name}
        </Text>
      </div>
    </button>
  );
}

// ── Main IntroBuilder Export ─────────────────────────────────────────────────
export interface IntroBuilderProps {
  onBack: () => void;
  onComplete: () => void;
  onOpenLibrary?: () => void;
}

export function IntroBuilder({
  onBack, onComplete, onOpenLibrary,
}: IntroBuilderProps) {
  const { show } = useToast();

  // ── Sidebar state ──
  const [topIntrosExpanded, setTopIntrosExpanded] = useState(true);
  const [savedTemplatesExpanded, setSavedTemplatesExpanded] = useState(false);
  const [imageTemplatesExpanded, setImageTemplatesExpanded] = useState(false);
  const [messageTemplatesExpanded, setMessageTemplatesExpanded] = useState(false);
  const [givingDaysExpanded, setGivingDaysExpanded] = useState(false);
  const [birthdaysExpanded, setBirthdaysExpanded] = useState(false);
  const [holidaysExpanded, setHolidaysExpanded] = useState(false);
  const [legacyExpanded, setLegacyExpanded] = useState(false);

  // ── Builder state ──
  const [selectedTheme, setSelectedTheme] = useState<IntroTheme>(INTRO_IMAGE_THEMES[3]);
  const [introText, setIntroText] = useState("Welcome to your personal video");
  const [selectedFont, setSelectedFont] = useState("roboto");
  const [selectedColors, setSelectedColors] = useState<string[]>([INTRO_COLOR_PALETTE[0]]);
  const [selectedMood, setSelectedMood] = useState<string>("uplifting");
  const [selectedTrack, setSelectedTrack] = useState<string | null>("bright-horizons");
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [showInRewindable, setShowInRewindable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUploadOpen, setThumbnailUploadOpen] = useState(false);

  // Build the preview background
  const previewBackground = (() => {
    if (selectedColors.length === 0) return selectedTheme.gradient;
    if (selectedColors.length === 1) {
      const c = selectedColors[0];
      return `linear-gradient(143.13deg, ${c} 0%, ${c}cc 50%, ${c}88 100%)`;
    }
    const stops = selectedColors.map(
      (c, i) => `${c} ${Math.round((i / (selectedColors.length - 1)) * 100)}%`
    );
    return `linear-gradient(143.13deg, ${stops.join(", ")})`;
  })();

  const activeFontFamily = INTRO_FONT_OPTIONS.find((f) => f.value === selectedFont)?.family ?? "sans-serif";

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const filteredTracks = INTRO_MUSIC_TRACKS.filter((t) => t.mood === selectedMood);
  const activeTrackLabel = INTRO_MUSIC_TRACKS.find((t) => t.value === selectedTrack)?.label ?? null;

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: TV.surfaceMuted }}>
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <div
        className="w-[260px] min-w-[220px] bg-white shrink-0 flex flex-col"
        style={{ borderRight: `1px solid ${TV.borderDivider}` }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 pt-3 pb-2.5" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint }}>
              <Clapperboard size={14} style={{ color: TV.brand }} />
            </div>
            <div className="flex-1 min-w-0">
              <Text fz={13} fw={800} c={TV.textPrimary} className="leading-[1.25]">New Intro</Text>
              <Text fz={11} c={TV.textSecondary} className="leading-[1.3] mt-0.5">Choose a theme and customize your intro.</Text>
            </div>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-auto">
          <BuilderThemeSection title="Top Intro Themes" count={9} isNew expanded={topIntrosExpanded} onToggle={() => setTopIntrosExpanded(!topIntrosExpanded)}>
            <div className="grid grid-cols-3 gap-2">
              {INTRO_IMAGE_THEMES.map((theme) => (
                <BuilderThemeTile key={theme.id} id={theme.id} name={theme.name} gradient={theme.gradient} selected={selectedTheme.id === theme.id} onSelect={() => setSelectedTheme(theme)} />
              ))}
            </div>
          </BuilderThemeSection>

          <BuilderThemeSection title="Your Saved Templates" count={6} expanded={savedTemplatesExpanded} onToggle={() => setSavedTemplatesExpanded(!savedTemplatesExpanded)}>
            <div className="grid grid-cols-3 gap-2">
              {INTRO_YOUR_SAVED.map((theme) => (
                <BuilderThemeTile key={theme.id} id={theme.id} name={theme.name} gradient={theme.gradient} selected={selectedTheme.id === theme.id} onSelect={() => setSelectedTheme(theme)} />
              ))}
            </div>
          </BuilderThemeSection>

          <BuilderThemeSection title="Image Templates" count={3} expanded={imageTemplatesExpanded} onToggle={() => setImageTemplatesExpanded(!imageTemplatesExpanded)} />
          <BuilderThemeSection title="Message Templates" count={3} expanded={messageTemplatesExpanded} onToggle={() => setMessageTemplatesExpanded(!messageTemplatesExpanded)} />
          <BuilderThemeSection title="Giving Days" count={2} expanded={givingDaysExpanded} onToggle={() => setGivingDaysExpanded(!givingDaysExpanded)} />
          <BuilderThemeSection title="Birthdays" count={2} expanded={birthdaysExpanded} onToggle={() => setBirthdaysExpanded(!birthdaysExpanded)} />
          <BuilderThemeSection title="Holidays" count={4} expanded={holidaysExpanded} onToggle={() => setHolidaysExpanded(!holidaysExpanded)} />
          <BuilderThemeSection title="Legacy Intros" count={10} expanded={legacyExpanded} onToggle={() => setLegacyExpanded(!legacyExpanded)} />

          {/* Browse Library link */}
          {onOpenLibrary && (
            <div className="px-3 py-3" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
              <button onClick={onOpenLibrary} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-tv-border-light text-tv-text-label hover:border-tv-brand hover:text-tv-brand transition-all" style={{ fontWeight: 500, fontSize: 12 }}>
                <Library size={12} />Browse Library
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Video Preview */}
            <div className="rounded-lg overflow-hidden relative aspect-video mb-4" style={{ background: previewBackground }}>
              {customThumbnail && (
                <img src={customThumbnail} alt="Custom thumbnail preview" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.35 }} />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Text fz={36} fw={800} c="white" className="text-center px-8" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)", fontFamily: activeFontFamily }}>
                  {introText || selectedTheme.name}
                </Text>
                <button onClick={() => setIsPlaying((p) => !p)} className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center hover:bg-white/30 transition-colors">
                  {isPlaying ? <Pause size={24} className="text-white" fill="white" /> : <Play size={24} className="text-white ml-1" fill="white" />}
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                {activeTrackLabel ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                    <Music size={10} className="text-white" />
                    <Text fz={10} c="white" className="leading-none">{activeTrackLabel}</Text>
                  </div>
                ) : <div />}
                <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                  <Text fz={10} c="white" className="leading-none">{selectedTheme.name} Theme</Text>
                </div>
              </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-white rounded-lg p-6 space-y-6" style={{ border: `1px solid ${TV.borderLight}` }}>
              {/* Intro Text */}
              <div>
                <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5" mb={6}>Intro Text</Text>
                <input type="text" autoComplete="off" value={introText} onChange={(e) => setIntroText(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-md outline-none"
                  style={{ border: `1px solid ${TV.borderLight}`, color: TV.textPrimary, fontSize: 16 }}
                  placeholder="Enter your intro headline..." />
              </div>

              {/* Font */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2.08333 8.33333L5 1.66667L7.91667 8.33333M3.75 8.33333H6.25M5 1.66667V8.33333" stroke={TV.textLabel} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">Font</Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTRO_FONT_OPTIONS.map((font) => (
                    <button key={font.value} onClick={() => setSelectedFont(font.value)}
                      className="px-4 h-[34px] rounded-full border transition-colors"
                      style={{
                        backgroundColor: selectedFont === font.value ? TV.brandTint : "white",
                        borderColor: selectedFont === font.value ? TV.brandBg : TV.borderLight,
                        color: selectedFont === font.value ? TV.brand : TV.textSecondary,
                        fontFamily: font.family, fontSize: 16,
                      }}>
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M5 1.66667C3.15905 1.66667 1.66667 3.15905 1.66667 5C1.66667 6.84095 3.15905 8.33333 5 8.33333C6.84095 8.33333 8.33333 6.84095 8.33333 5C8.33333 3.15905 6.84095 1.66667 5 1.66667Z" fill={TV.textLabel} stroke={TV.textLabel} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">Colors</Text>
                </div>
                <div className="flex items-center gap-3">
                  {INTRO_COLOR_PALETTE.map((color) => (
                    <button key={color} onClick={() => toggleColor(color)} className="relative">
                      <div className="w-[28px] h-[28px] rounded-full border" style={{
                        backgroundColor: color,
                        borderColor: selectedColors.includes(color) ? TV.brandBg : "transparent",
                        boxShadow: selectedColors.includes(color) ? "0px 0px 0px 1px white" : `0px 0px 0px 1px ${TV.borderLight}`,
                      }}>
                        {selectedColors.includes(color) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path d="M2 5.5L4.5 8L9 3.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <ColorPickerPopover
                    value={selectedColors[0] ?? "#7c45b0"}
                    onChange={(hex) => setSelectedColors([hex])}
                    presets={INTRO_COLOR_PALETTE}
                  />
                </div>
              </div>

              {/* Music */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M3.33333 7.5V3.33333M5.83333 7.5V1.66667M1.66667 7.5V5" stroke={TV.textLabel} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">Music</Text>
                </div>
                <div className="flex gap-2 mb-3">
                  {INTRO_MOOD_OPTIONS.map((mood) => (
                    <button key={mood.value} onClick={() => {
                      setSelectedMood(mood.value);
                      const firstTrack = INTRO_MUSIC_TRACKS.find((t) => t.mood === mood.value);
                      setSelectedTrack(firstTrack ? firstTrack.value : null);
                    }} className="px-4 h-[30px] rounded-full border transition-colors" style={{
                      backgroundColor: selectedMood === mood.value ? TV.brandTint : "white",
                      borderColor: selectedMood === mood.value ? TV.brandBg : TV.borderLight,
                      color: selectedMood === mood.value ? TV.brand : TV.textSecondary, fontSize: 16,
                    }}>
                      {mood.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {/* No Music option */}
                  <div role="button" tabIndex={0} onClick={() => setSelectedTrack(null)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedTrack(null); }}}
                    className="h-[37px] rounded-sm border px-2 flex items-center gap-2.5 relative cursor-pointer transition-colors"
                    style={{ borderColor: selectedTrack === null ? TV.brandBg : TV.borderLight, backgroundColor: selectedTrack === null ? TV.brandTint : "white" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: selectedTrack === null ? TV.brandBg : TV.surface }}>
                      <VolumeX size={10} style={{ color: selectedTrack === null ? "white" : TV.textPrimary }} />
                    </div>
                    <Text fz={10} fw={selectedTrack === null ? 600 : 500} c={selectedTrack === null ? TV.brand : TV.textPrimary} className="flex-1">No Music</Text>
                  </div>
                  {filteredTracks.map((track) => {
                    const isActive = selectedTrack === track.value;
                    return (
                      <div key={track.value} role="button" tabIndex={0} onClick={() => setSelectedTrack(isActive ? null : track.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedTrack(isActive ? null : track.value); }}}
                        className="h-[37px] rounded-sm border px-2 flex items-center gap-2.5 relative cursor-pointer transition-colors"
                        style={{ borderColor: isActive ? TV.brandBg : TV.borderLight, backgroundColor: isActive ? TV.brandTint : "white" }}>
                        <button className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: isActive ? TV.brandBg : TV.surface }}>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M2 2.5L5.5 4.5L2 6.5V2.5Z" fill={isActive ? "white" : TV.textPrimary} stroke={isActive ? "white" : TV.textPrimary} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.666" />
                          </svg>
                        </button>
                        <Text fz={10} fw={isActive ? 600 : 500} c={isActive ? TV.brand : TV.textPrimary} className="flex-1">{track.label}</Text>
                        <Text fz={9} c={isActive ? TV.brand : TV.textDecorative}>{track.duration}</Text>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Thumbnail */}
              <div>
                <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5" mb={3}>Custom Background Image</Text>
                {!customThumbnail ? (
                  <button onClick={() => setThumbnailUploadOpen(true)}
                    className="w-full h-32 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-tv-surface-muted transition-colors"
                    style={{ borderColor: TV.borderLight }}>
                    <Upload size={20} style={{ color: TV.textSecondary }} />
                    <Text fz={12} c={TV.textSecondary}>Drop image or browse</Text>
                  </button>
                ) : (
                  <div className="relative rounded-md overflow-hidden">
                    <img src={customThumbnail} alt="Thumbnail" className="w-full h-32 object-cover" />
                    <button onClick={() => { setCustomThumbnail(null); show("Thumbnail removed", "success"); }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
                      <Trash2 size={12} color="white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Show in rewindable template */}
              
            </div>
          </div>
        </div>

      </div>

      {/* Thumbnail upload modal */}
      <ImageUploadModal
        opened={thumbnailUploadOpen}
        onClose={() => setThumbnailUploadOpen(false)}
        title="Upload Custom Thumbnail"
        subtitle="Upload an image to use as a background thumbnail for your intro."
        maxSizeKB={2048}
        onUpload={(result) => {
          setCustomThumbnail(result.url);
          show(`"${result.name}" set as custom thumbnail`, "success");
        }}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  OutroBuilder  — Figma prototype layout (matches IntroBuilder pattern)
// ═════════════════════════════════════════════════════════════════════════════

// ── Outro-specific theme data ────────────────────────────────────────────────
interface OutroTheme {
  id: number;
  name: string;
  category: "saved" | "video" | "legacy";
  gradient: string;
  ctaLabel: string;
}

const OUTRO_THEMES: OutroTheme[] = [
  { id: 1, name: "Thanks!", category: "saved", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)", ctaLabel: "Thank You" },
  { id: 2, name: "Donate", category: "saved", gradient: "linear-gradient(143.13deg, #166534 0%, #15803d 100%)", ctaLabel: "Donate Now" },
  { id: 3, name: "Visit", category: "saved", gradient: "linear-gradient(143.13deg, #007c9e 0%, #00c0f5 100%)", ctaLabel: "Visit Us" },
  { id: 4, name: "Connect", category: "saved", gradient: "linear-gradient(143.13deg, #b45309 0%, #b45309 100%)", ctaLabel: "Connect" },
  { id: 5, name: "Give Now", category: "video", gradient: "linear-gradient(143.13deg, #1B3461 0%, #3b82f6 100%)", ctaLabel: "Give Now" },
  { id: 6, name: "Support", category: "video", gradient: "linear-gradient(143.13deg, #b91c1c 0%, #dc2626 100%)", ctaLabel: "Support Us" },
  { id: 7, name: "Learn More", category: "video", gradient: "linear-gradient(143.13deg, #0f766e 0%, #2dd4bf 100%)", ctaLabel: "Learn More" },
  { id: 8, name: "Register", category: "video", gradient: "linear-gradient(143.13deg, #374151 0%, #6b7280 100%)", ctaLabel: "Register" },
  { id: 9, name: "Explore", category: "video", gradient: "linear-gradient(143.13deg, #4c1d95 0%, #7c3aed 100%)", ctaLabel: "Explore" },
  { id: 10, name: "Classic CTA", category: "legacy", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)", ctaLabel: "Click Here" },
  { id: 11, name: "Simple End", category: "legacy", gradient: "linear-gradient(143.13deg, #374151 0%, #6b7280 100%)", ctaLabel: "" },
  { id: 12, name: "Branded", category: "legacy", gradient: "linear-gradient(143.13deg, #1B3461 0%, #3b82f6 100%)", ctaLabel: "Visit" },
];

const OUTRO_BG_COLORS = [
  "#7c45b0", "#1e3a8a", "#14532d", "#b91c1c", "#0f766e", "#374151", "#b45309", "#ffffff",
];

const OUTRO_MOOD_OPTIONS = [
  { value: "uplifting", label: "Uplifting" },
  { value: "calm", label: "Calm" },
  { value: "corporate", label: "Corporate" },
  { value: "festive", label: "Festive" },
];

const OUTRO_MUSIC_TRACKS = [
  { value: "bright-horizons", label: "Bright Horizons", mood: "uplifting", duration: "0:30" },
  { value: "sunrise-walk", label: "Sunrise Walk", mood: "uplifting", duration: "0:25" },
  { value: "still-waters", label: "Still Waters", mood: "calm", duration: "0:22" },
  { value: "quiet-evening", label: "Quiet Evening", mood: "calm", duration: "0:28" },
  { value: "forward-motion", label: "Forward Motion", mood: "corporate", duration: "0:20" },
  { value: "steady-climb", label: "Steady Climb", mood: "corporate", duration: "0:18" },
  { value: "bright-bells", label: "Bright Bells", mood: "festive", duration: "0:24" },
  { value: "celebration", label: "Celebration", mood: "festive", duration: "0:30" },
];

// ── Main OutroBuilder Export ─────────────────────────────────────────────────
export interface OutroBuilderProps {
  onBack: () => void;
  onComplete: () => void;
  onOpenLibrary?: () => void;
}

export function OutroBuilder({
  onBack, onComplete, onOpenLibrary,
}: OutroBuilderProps) {
  const { show } = useToast();

  // ── Sidebar state ──
  const [savedExpanded, setSavedExpanded] = useState(true);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [legacyExpanded, setLegacyExpanded] = useState(false);

  // ── Builder state ──
  const [selectedTheme, setSelectedTheme] = useState<OutroTheme>(OUTRO_THEMES[2]);
  const [ctaUrl, setCtaUrl] = useState("");
  const [buttonText, setButtonText] = useState("Donate Now");
  const [selectedColor, setSelectedColor] = useState<string>(OUTRO_BG_COLORS[0]);
  const [selectedMood, setSelectedMood] = useState<string>("uplifting");
  const [selectedTrack, setSelectedTrack] = useState<string | null>("bright-horizons");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Build the preview background from the selected color
  const previewBackground = (() => {
    const c = selectedColor;
    if (c === "#ffffff") return `linear-gradient(143.13deg, #f8f8f8 0%, #ffffff 100%)`;
    return `linear-gradient(143.13deg, ${c} 0%, ${c}cc 50%, ${c}88 100%)`;
  })();

  const isLightBg = selectedColor === "#ffffff";
  const textOnBg = isLightBg ? TV.textPrimary : "white";

  const filteredTracks = OUTRO_MUSIC_TRACKS.filter((t) => t.mood === selectedMood);
  const activeTrackLabel = OUTRO_MUSIC_TRACKS.find((t) => t.value === selectedTrack)?.label ?? null;

  const savedThemes = OUTRO_THEMES.filter((t) => t.category === "saved");
  const videoThemes = OUTRO_THEMES.filter((t) => t.category === "video");
  const legacyThemes = OUTRO_THEMES.filter((t) => t.category === "legacy");

  const handleSelectTheme = (theme: OutroTheme) => {
    setSelectedTheme(theme);
    if (theme.ctaLabel) setButtonText(theme.ctaLabel);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: TV.surfaceMuted }}>
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <div
        className="w-[260px] min-w-[220px] bg-white shrink-0 flex flex-col"
        style={{ borderRight: `1px solid ${TV.borderDivider}` }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-4 pt-3 pb-2.5"
          style={{ borderBottom: `1px solid ${TV.borderDivider}` }}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
              style={{ backgroundColor: TV.brandTint }}
            >
              <MonitorPlay size={14} style={{ color: TV.brand }} />
            </div>
            <div className="flex-1 min-w-0">
              <Text fz={13} fw={800} c={TV.textPrimary} className="leading-[1.25]">
                New Outro
              </Text>
              <Text fz={11} c={TV.textSecondary} className="leading-[1.3] mt-0.5">
                Choose a theme and customize your outro.
              </Text>
            </div>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-auto">
          <BuilderThemeSection
            title="Your Outro Templates"
            count={savedThemes.length}
            expanded={savedExpanded}
            onToggle={() => setSavedExpanded(!savedExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {savedThemes.map((theme) => (
                <BuilderThemeTile
                  key={theme.id}
                  id={theme.id}
                  name={theme.name}
                  gradient={theme.gradient}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => handleSelectTheme(theme)}
                />
              ))}
            </div>
          </BuilderThemeSection>

          <BuilderThemeSection
            title="Video Outros"
            count={videoThemes.length}
            expanded={videoExpanded}
            onToggle={() => setVideoExpanded(!videoExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {videoThemes.map((theme) => (
                <BuilderThemeTile
                  key={theme.id}
                  id={theme.id}
                  name={theme.name}
                  gradient={theme.gradient}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => handleSelectTheme(theme)}
                />
              ))}
            </div>
          </BuilderThemeSection>

          <BuilderThemeSection
            title="Legacy Outros"
            count={legacyThemes.length}
            expanded={legacyExpanded}
            onToggle={() => setLegacyExpanded(!legacyExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {legacyThemes.map((theme) => (
                <BuilderThemeTile
                  key={theme.id}
                  id={theme.id}
                  name={theme.name}
                  gradient={theme.gradient}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => handleSelectTheme(theme)}
                />
              ))}
            </div>
          </BuilderThemeSection>

          {/* Browse Library link */}
          {onOpenLibrary && (
            <div className="px-3 py-3" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
              <button onClick={onOpenLibrary} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-tv-border-light text-tv-text-label hover:border-tv-brand hover:text-tv-brand transition-all" style={{ fontWeight: 500, fontSize: 12 }}>
                <Library size={12} />Browse Library
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview + Config */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Video Preview */}
            <div
              className="rounded-lg overflow-hidden relative aspect-video mb-4"
              style={{ background: previewBackground }}
            >
              {/* CTA Button badge (top-left) */}
              {buttonText && (
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                  <Text fz={10} c="white" fw={500} className="leading-none">
                    {buttonText}
                  </Text>
                </div>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {/* Theme name as large centered text */}
                <Text
                  fz={36}
                  fw={800}
                  c={textOnBg}
                  className="text-center px-8"
                  style={{
                    textShadow: isLightBg ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
                    opacity: 0.6,
                    fontFamily: "'Fraunces', Roboto, sans-serif",
                  }}
                >
                  {buttonText || selectedTheme.name}
                </Text>

                {/* Play / Pause toggle */}
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={24} className="text-white" fill="white" />
                  ) : (
                    <Play size={24} className="text-white ml-1" fill="white" />
                  )}
                </button>
              </div>

              {/* Bottom bar: theme badge + music indicator */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                {activeTrackLabel ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                    <Music size={10} className="text-white" />
                    <Text fz={10} c="white" className="leading-none">
                      {activeTrackLabel}
                    </Text>
                  </div>
                ) : (
                  <div />
                )}
                <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                  <Text fz={10} c="white" className="leading-none">
                    {selectedTheme.name} Theme
                  </Text>
                </div>
              </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-white rounded-lg p-6 space-y-6" style={{ border: `1px solid ${TV.borderLight}` }}>
              {/* CTA Link URL */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={10} style={{ color: TV.textLabel }} />
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    CTA Link URL
                  </Text>
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-md outline-none"
                  style={{ border: `1px solid ${TV.borderLight}`, color: TV.textPrimary, fontSize: 16 }}
                  placeholder="https://"
                />
              </div>

              {/* Button Text */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2.08333 8.33333L5 1.66667L7.91667 8.33333M3.75 8.33333H6.25M5 1.66667V8.33333"
                      stroke={TV.textLabel}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.833333"
                    />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    Button Text
                  </Text>
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-md outline-none"
                  style={{ border: `1px solid ${TV.borderLight}`, color: TV.textPrimary, fontSize: 16 }}
                  placeholder="Donate Now"
                />
              </div>

              {/* Background Color */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5 1.66667C3.15905 1.66667 1.66667 3.15905 1.66667 5C1.66667 6.84095 3.15905 8.33333 5 8.33333C6.84095 8.33333 8.33333 6.84095 8.33333 5C8.33333 3.15905 6.84095 1.66667 5 1.66667Z"
                      fill={TV.textLabel}
                      stroke={TV.textLabel}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.833333"
                    />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    Background Color
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  {OUTRO_BG_COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    const isWhite = color === "#ffffff";
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="relative"
                      >
                        <div
                          className="w-[28px] h-[28px] rounded-full"
                          style={{
                            backgroundColor: color,
                            boxShadow: isSelected
                              ? `0px 0px 0px 1.5px ${TV.brandBg}`
                              : isWhite
                              ? `0px 0px 0px 1px ${TV.borderLight}`
                              : "0px 0px 0px 1px transparent",
                            border: isWhite && !isSelected ? `1.5px solid ${TV.borderLight}` : "none",
                          }}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                <path
                                  d="M2 5.5L4.5 8L9 3.5"
                                  stroke={isWhite ? TV.brand : "white"}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="0.916667"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  <ColorPickerPopover
                    value={selectedColor}
                    onChange={(hex) => setSelectedColor(hex)}
                    presets={OUTRO_BG_COLORS}
                  />
                </div>
              </div>

              {/* Music */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M3.33333 7.5V3.33333M5.83333 7.5V1.66667M1.66667 7.5V5"
                      stroke={TV.textLabel}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.833333"
                    />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    Music
                  </Text>
                </div>

                {/* Mood pills */}
                <div className="flex gap-2 mb-3">
                  {OUTRO_MOOD_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => {
                        setSelectedMood(mood.value);
                        const firstTrack = OUTRO_MUSIC_TRACKS.find((t) => t.mood === mood.value);
                        setSelectedTrack(firstTrack ? firstTrack.value : null);
                      }}
                      className="px-4 h-[30px] rounded-full border transition-colors"
                      style={{
                        backgroundColor: selectedMood === mood.value ? TV.brandTint : "white",
                        borderColor: selectedMood === mood.value ? TV.brandBg : TV.borderLight,
                        color: selectedMood === mood.value ? TV.brand : TV.textSecondary,
                        fontSize: 16,
                      }}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>

                {/* Track list */}
                <div className="space-y-1.5">
                  {/* No Music option */}
                  <div role="button" tabIndex={0} onClick={() => setSelectedTrack(null)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedTrack(null); }}}
                    className="h-[37px] rounded-sm border px-2 flex items-center gap-2.5 relative cursor-pointer transition-colors"
                    style={{ borderColor: selectedTrack === null ? TV.brandBg : TV.borderLight, backgroundColor: selectedTrack === null ? TV.brandTint : "white" }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: selectedTrack === null ? TV.brandBg : TV.surface }}>
                      <VolumeX size={10} style={{ color: selectedTrack === null ? "white" : TV.textPrimary }} />
                    </div>
                    <Text fz={10} fw={selectedTrack === null ? 600 : 500} c={selectedTrack === null ? TV.brand : TV.textPrimary} className="flex-1">No Music</Text>
                  </div>
                  {filteredTracks.map((track) => {
                    const isActive = selectedTrack === track.value;
                    return (
                      <div
                        key={track.value}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTrack(isActive ? null : track.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedTrack(isActive ? null : track.value); }}}
                        className="h-[37px] rounded-sm border px-2 flex items-center gap-2.5 cursor-pointer transition-colors"
                        style={{
                          borderColor: isActive ? TV.brandBg : TV.borderLight,
                          backgroundColor: isActive ? TV.brandTint : "white",
                        }}
                      >
                        <button
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isActive ? TV.brandBg : TV.surface }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path
                              d="M2 2.5L5.5 4.5L2 6.5V2.5Z"
                              fill={isActive ? "white" : TV.textPrimary}
                              stroke={isActive ? "white" : TV.textPrimary}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="0.666"
                            />
                          </svg>
                        </button>
                        <Text fz={10} fw={isActive ? 600 : 500} c={isActive ? TV.brand : TV.textPrimary} className="flex-1">
                          {track.label}
                        </Text>
                        <Text fz={9} c={isActive ? TV.brand : TV.textDecorative}>
                          {track.duration}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save as reusable template */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: TV.brand }}
                />
                <Text fz={12} c={TV.textPrimary}>
                  Save as reusable template
                </Text>
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
