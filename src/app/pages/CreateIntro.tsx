import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Play, Pause, ChevronDown, ChevronLeft, Upload, Trash2,
  Save, Send, ChevronRight, Clapperboard, Music,
} from "lucide-react";
import { Text } from "@mantine/core";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";
import { ImageUploadModal } from "../components/ui/ImageUploadModal";

// ── Intro Theme Data ────────────────────────────────────────────────────────
interface IntroTheme {
  id: number;
  name: string;
  category: "image" | "message";
  gradient: string;
  thumbnail: string;
}

const IMAGE_THEMES: IntroTheme[] = [
  { id: 1, name: "Welcome", category: "image", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #995cd3 100%)", thumbnail: "https://images.unsplash.com/photo-1607369542452-78f59815692d?w=400" },
  { id: 2, name: "Thank You", category: "image", gradient: "linear-gradient(143.134deg, #0e8a45 0%, #16b364 100%)", thumbnail: "https://images.unsplash.com/photo-1591218214141-45545921d2d9?w=400" },
  { id: 3, name: "Hello", category: "image", gradient: "linear-gradient(143.134deg, #374151 0%, #6b7280 100%)", thumbnail: "https://images.unsplash.com/photo-1763890965405-a376a73dc8ed?w=400" },
  { id: 4, name: "Dear You", category: "image", gradient: "linear-gradient(143.13deg, #991b1b 0%, #ef4444 100%)", thumbnail: "https://images.unsplash.com/photo-1607369542452-78f59815692d?w=400" },
  { id: 5, name: "Hi there", category: "image", gradient: "linear-gradient(143.134deg, #0090bb 0%, #00c0f5 100%)", thumbnail: "https://images.unsplash.com/photo-1591218214141-45545921d2d9?w=400" },
  { id: 6, name: "Greetings", category: "image", gradient: "linear-gradient(143.134deg, #b45309 0%, #f59e0b 100%)", thumbnail: "https://images.unsplash.com/photo-1763890965405-a376a73dc8ed?w=400" },
  { id: 7, name: "Welcome", category: "message", gradient: "linear-gradient(143.13deg, #4c1d95 0%, #7c3aed 100%)", thumbnail: "" },
  { id: 8, name: "Hello", category: "message", gradient: "linear-gradient(143.134deg, #1e3a8a 0%, #3b82f6 100%)", thumbnail: "" },
  { id: 9, name: "Thanks", category: "message", gradient: "linear-gradient(143.134deg, #0f766e 0%, #2dd4bf 100%)", thumbnail: "" },
];

const YOUR_SAVED = IMAGE_THEMES.slice(0, 6);

const FONT_OPTIONS = [
  { value: "roboto", label: "Roboto", family: "'Roboto', sans-serif" },
  { value: "fraunces", label: "Fraunces", family: "'Fraunces', Roboto, sans-serif" },
  { value: "playfair", label: "Playfair Display", family: "'Playfair Display', Roboto, sans-serif" },
  { value: "inter", label: "Inter", family: "'Inter', Roboto, sans-serif" },
  { value: "montserrat", label: "Montserrat", family: "'Montserrat', Roboto, sans-serif" },
  { value: "lora", label: "Lora", family: "'Lora', Roboto, sans-serif" },
  { value: "merriweather", label: "Merriweather", family: "'Merriweather', Roboto, sans-serif" },
];

const COLOR_PALETTE = [
  "#7c45b0", "#3b82f6", "#1B3461", "#16A34A", "#059669", "#C8962A", "#dc2626",
];

const MUSIC_OPTIONS = [
  { value: "uplifting", label: "Uplifting" },
  { value: "calm", label: "Calm" },
  { value: "corporate", label: "Corporate" },
  { value: "festive", label: "Festive" },
];

const MUSIC_TRACKS = [
  { value: "bright-horizons", label: "Bright Horizons", mood: "uplifting", duration: "0:38" },
  { value: "morning-light", label: "Morning Light", mood: "uplifting", duration: "0:45" },
  { value: "sparse-walk", label: "Sparse Walk", mood: "calm", duration: "1:22" },
  { value: "still-waters", label: "Still Waters", mood: "calm", duration: "0:52" },
  { value: "forward-motion", label: "Forward Motion", mood: "corporate", duration: "0:41" },
  { value: "steady-climb", label: "Steady Climb", mood: "corporate", duration: "0:36" },
  { value: "bright-bells", label: "Bright Bells", mood: "festive", duration: "0:34" },
  { value: "celebration", label: "Celebration", mood: "festive", duration: "0:48" },
];

// Google Fonts URL for preview
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;800&family=Inter:wght@400;600;800&family=Lora:wght@400;700&family=Merriweather:wght@400;700;900&family=Montserrat:wght@400;600;800&family=Playfair+Display:wght@400;700;800&family=Roboto:wght@400;500;700&display=swap";

// ── Sidebar Theme Section ───────────────────────────────────────────────────
function ThemeSection({
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

// ── Theme Tile ──────────────────────────────────────────────────────────────
function ThemeTile({
  theme,
  selected,
  onSelect,
}: {
  theme: IntroTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full h-[56px] rounded-md overflow-hidden relative group"
      style={{
        background: theme.gradient,
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
            <path
              d="M1.5 3.5L3 5L5.5 2"
              stroke="white"
              strokeWidth="0.583333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Text fz={8} fw={600} c="rgba(255,255,255,0.7)">
          {theme.name}
        </Text>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function CreateIntro() {
  const navigate = useNavigate();
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
  const [selectedTheme, setSelectedTheme] = useState<IntroTheme>(IMAGE_THEMES[3]);
  const [introText, setIntroText] = useState("Welcome to your personal video");
  const [selectedFont, setSelectedFont] = useState("roboto");
  const [selectedColors, setSelectedColors] = useState<string[]>([COLOR_PALETTE[0]]);
  const [selectedMood, setSelectedMood] = useState<string>("uplifting");
  const [selectedTrack, setSelectedTrack] = useState<string | null>("bright-horizons");
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [showInRewindable, setShowInRewindable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUploadOpen, setThumbnailUploadOpen] = useState(false);

  // Build the preview background: selected colors override the theme gradient
  const previewBackground = (() => {
    if (selectedColors.length === 0) return selectedTheme.gradient;
    if (selectedColors.length === 1) {
      // Single color → gradient from a darkened version to the color
      const c = selectedColors[0];
      return `linear-gradient(143.13deg, ${c} 0%, ${c}cc 50%, ${c}88 100%)`;
    }
    // Multiple colors → gradient across all selected
    const stops = selectedColors.map(
      (c, i) => `${c} ${Math.round((i / (selectedColors.length - 1)) * 100)}%`
    );
    return `linear-gradient(143.13deg, ${stops.join(", ")})`;
  })();

  // Resolve the font family string for the preview
  const activeFontFamily = FONT_OPTIONS.find((f) => f.value === selectedFont)?.family ?? "sans-serif";

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleDiscard = () => {
    navigate("/assets/intros");
  };

  const handleSaveToLibrary = () => {
    show("Intro saved to your intro library", "success");
    setTimeout(() => navigate("/assets/intros"), 1200);
  };

  const handleSaveAndUse = () => {
    show("Intro saved \u2014 opening campaign builder\u2026", "success");
    setTimeout(() => navigate("/campaigns/create"), 1200);
  };

  const filteredTracks = MUSIC_TRACKS.filter((t) => t.mood === selectedMood);
  const activeTrackLabel = MUSIC_TRACKS.find((t) => t.value === selectedTrack)?.label ?? null;

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: TV.surfaceMuted }}>
      {/* Load Google Fonts for the preview */}
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/assets/intros")}
              className="flex items-center gap-1 hover:text-tv-brand transition-colors"
              style={{ color: TV.textSecondary }}
            >
              <ChevronLeft size={12} />
              <span className="text-[11px]" style={{ fontWeight: 500 }}>Intro Library</span>
            </button>
          </div>

          <div className="flex items-start gap-2.5 mt-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: TV.brandTint }}
            >
              <Clapperboard size={14} style={{ color: TV.brand }} />
            </div>
            <div className="flex-1 min-w-0">
              <Text fz={13} fw={800} c={TV.textPrimary} className="leading-[1.25]">
                New Intro
              </Text>
              <Text fz={11} c={TV.textSecondary} className="leading-[1.3] mt-0.5">
                Choose a theme and customize your intro.
              </Text>
            </div>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-auto">
          <ThemeSection
            title="Top Intro Themes"
            count={9}
            isNew
            expanded={topIntrosExpanded}
            onToggle={() => setTopIntrosExpanded(!topIntrosExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {IMAGE_THEMES.map((theme) => (
                <ThemeTile
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => setSelectedTheme(theme)}
                />
              ))}
            </div>
          </ThemeSection>

          <ThemeSection
            title="Your Saved Templates"
            count={6}
            expanded={savedTemplatesExpanded}
            onToggle={() => setSavedTemplatesExpanded(!savedTemplatesExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {YOUR_SAVED.map((theme) => (
                <ThemeTile
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => setSelectedTheme(theme)}
                />
              ))}
            </div>
          </ThemeSection>

          <ThemeSection
            title="Image Templates"
            count={3}
            expanded={imageTemplatesExpanded}
            onToggle={() => setImageTemplatesExpanded(!imageTemplatesExpanded)}
          />

          <ThemeSection
            title="Message Templates"
            count={3}
            expanded={messageTemplatesExpanded}
            onToggle={() => setMessageTemplatesExpanded(!messageTemplatesExpanded)}
          />

          <ThemeSection
            title="Giving Days"
            count={2}
            expanded={givingDaysExpanded}
            onToggle={() => setGivingDaysExpanded(!givingDaysExpanded)}
          />

          <ThemeSection
            title="Birthdays"
            count={2}
            expanded={birthdaysExpanded}
            onToggle={() => setBirthdaysExpanded(!birthdaysExpanded)}
          />

          <ThemeSection
            title="Holidays"
            count={4}
            expanded={holidaysExpanded}
            onToggle={() => setHolidaysExpanded(!holidaysExpanded)}
          />

          <ThemeSection
            title="Legacy Intros"
            count={10}
            expanded={legacyExpanded}
            onToggle={() => setLegacyExpanded(!legacyExpanded)}
          />
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Video Preview */}
            <div
              className="rounded-lg overflow-hidden relative aspect-video mb-4"
              style={{ background: previewBackground }}
            >
              {/* Custom thumbnail background layer */}
              {customThumbnail && (
                <img
                  src={customThumbnail}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: 0.35 }}
                />
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {/* Intro text — reflects typed input + selected font */}
                <Text
                  fz={36}
                  fw={800}
                  c="white"
                  className="text-center px-8"
                  style={{
                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    fontFamily: activeFontFamily,
                  }}
                >
                  {introText || selectedTheme.name}
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
                {/* Music indicator */}
                {activeTrackLabel && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                    <Music size={10} className="text-white" />
                    <Text fz={10} c="white" className="leading-none">
                      {activeTrackLabel}
                    </Text>
                  </div>
                )}
                {!activeTrackLabel && <div />}

                {/* Theme badge */}
                <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                  <Text fz={10} c="white" className="leading-none">
                    {selectedTheme.name} Theme
                  </Text>
                </div>
              </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-white rounded-lg p-6 space-y-6" style={{ border: `1px solid ${TV.borderLight}` }}>
              {/* Intro Text */}
              <div>
                <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5" mb={6}>
                  Intro Text
                </Text>
                <input
                  type="text"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg text-[16px] outline-none"
                  style={{ border: `1px solid ${TV.borderLight}`, color: TV.textPrimary }}
                  placeholder="Enter your intro headline..."
                />
              </div>

              {/* Font */}
              <div>
                <div className="flex items-center gap-2 mb-3">
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
                    Font
                  </Text>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font.value)}
                      className="px-4 h-[34px] rounded-full text-[16px] border transition-colors"
                      style={{
                        backgroundColor: selectedFont === font.value ? TV.brandTint : "white",
                        borderColor: selectedFont === font.value ? TV.brandBg : TV.borderLight,
                        color: selectedFont === font.value ? TV.brand : TV.textSecondary,
                        fontFamily: font.family,
                      }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
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
                    Colors
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className="relative"
                    >
                      <div
                        className="w-[28px] h-[28px] rounded-full border"
                        style={{
                          backgroundColor: color,
                          borderColor: selectedColors.includes(color) ? TV.brandBg : "transparent",
                          boxShadow: selectedColors.includes(color)
                            ? "0px 0px 0px 1px white"
                            : `0px 0px 0px 1px ${TV.borderLight}`,
                        }}
                      >
                        {selectedColors.includes(color) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                              <path
                                d="M2 5.5L4.5 8L9 3.5"
                                stroke="white"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="0.916667"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      show("Custom color picker coming soon", "info");
                    }}
                    className="w-[28px] h-[28px] rounded-full border flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ borderColor: TV.borderLight }}
                    title="Custom color"
                  >
                    <div className="w-full h-full rounded-full" style={{ background: "linear-gradient(135deg, red, orange, yellow, green, blue, indigo, violet)", opacity: 0.7 }} />
                  </button>
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
                  {MUSIC_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => {
                        setSelectedMood(mood.value);
                        // Auto-select the first track in the new mood
                        const firstTrack = MUSIC_TRACKS.find((t) => t.mood === mood.value);
                        setSelectedTrack(firstTrack ? firstTrack.value : null);
                      }}
                      className="px-4 h-[30px] rounded-full text-[16px] border transition-colors"
                      style={{
                        backgroundColor: selectedMood === mood.value ? TV.brandTint : "white",
                        borderColor: selectedMood === mood.value ? TV.brandBg : TV.borderLight,
                        color: selectedMood === mood.value ? TV.brand : TV.textSecondary,
                      }}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>

                {/* Track list */}
                <div className="space-y-1.5">
                  {filteredTracks.map((track) => {
                    const isActive = selectedTrack === track.value;
                    return (
                      <div
                        key={track.value}
                        onClick={() => setSelectedTrack(isActive ? null : track.value)}
                        className="h-[37px] rounded-lg border px-2 flex items-center gap-2.5 relative cursor-pointer transition-colors"
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

              {/* Custom Thumbnail */}
              <div>
                <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5" mb={3}>
                  Custom Thumbnail
                </Text>
                {!customThumbnail ? (
                  <button
                    onClick={() => setThumbnailUploadOpen(true)}
                    className="w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-tv-surface-muted transition-colors"
                    style={{ borderColor: TV.borderLight }}
                  >
                    <Upload size={20} style={{ color: TV.textSecondary }} />
                    <Text fz={12} c={TV.textSecondary}>
                      Drop image or browse
                    </Text>
                  </button>
                ) : (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={customThumbnail} alt="Thumbnail" className="w-full h-32 object-cover" />
                    <button
                      onClick={() => {
                        setCustomThumbnail(null);
                        show("Thumbnail removed", "success");
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <Trash2 size={12} color="white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Show in rewindable template */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInRewindable}
                  onChange={(e) => setShowInRewindable(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: TV.brand }}
                />
                <Text fz={12} c={TV.textPrimary}>
                  Show in rewindable template
                </Text>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 bg-white px-3 sm:px-6 py-3 flex items-center justify-between border-t border-tv-border-divider"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 text-[12px] transition-colors hover:text-tv-brand"
              style={{ fontWeight: 500, color: TV.textSecondary }}
            >
              <Trash2 size={13} />
              Discard
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSaveToLibrary}
              className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full border border-tv-border text-tv-brand hover:bg-tv-brand-tint transition-all"
              style={{ fontWeight: 600 }}
            >
              <Save size={12} />Save to Library
            </button>
            <button
              onClick={handleSaveAndUse}
              className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover text-white transition-all"
              style={{ fontWeight: 600 }}
            >
              <Send size={12} />Save & Use in Campaign
              <ChevronRight size={14} />
            </button>
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

export default CreateIntro;